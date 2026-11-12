/**
 * Вебхук ЮKassa: Rutina (slug: yookassa-webhook-rutina).
 *  1. Принимает payment.succeeded и перезапрашивает платёж в API ЮKassa (тело уведомления не доверенное).
 *  2. Проверяет проект и сумму по тарифу.
 *  3. Повторные уведомления по тому же платежу пропускает (метка в kv_store_a5927615).
 *  4. Продлевает доступ от текущей даты окончания, если подписка ещё активна.
 *  5. Пишет в user_access по ключу (user_id, project): доступ одного проекта не затирает другой.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PROJECT = "rutina";
const SHOP_ID = Deno.env.get("YOOKASSA_SHOP_ID_RUTINA") ?? "";
const SECRET_KEY = Deno.env.get("YOOKASSA_SECRET_KEY_RUTINA") ?? "";
const KV_TABLE = "kv_store_a5927615";

// Тарифы: сумма должна совпадать с create-payment-rutina
const PLANS: Record<string, { amount: string; days?: number; months?: number; years?: number }> = {
  monthly: { amount: "500.00", months: 1 },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  // ЮKassa отключена: магазин не активен. Включить — секрет PAYMENTS_ENABLED=true.
  if (Deno.env.get("PAYMENTS_ENABLED") !== "true") return json({ error: "Payments disabled" }, 503);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (body?.event !== "payment.succeeded") {
    return json({ received: true, ignored: true, reason: "Not payment.succeeded" });
  }
  const paymentId: string | undefined = body?.object?.id;
  if (!paymentId) return json({ error: "Missing payment id" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SHOP_ID || !SECRET_KEY || !supabaseUrl || !serviceRoleKey) {
    console.error("yookassa-webhook-rutina: missing secrets");
    return json({ error: "Not configured" }, 500);
  }

  // 1. Проверка платежа напрямую в ЮKassa
  let payment: any;
  try {
    const res = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${btoa(`${SHOP_ID}:${SECRET_KEY}`)}` },
    });
    if (res.status === 404) return json({ error: "Payment not found" }, 400);
    if (!res.ok) {
      console.error(`yookassa-webhook-rutina: verify failed ${paymentId}: ${res.status}`);
      return json({ error: "Verification failed" }, 500); // ЮKassa повторит позже
    }
    payment = await res.json();
  } catch (err) {
    console.error("yookassa-webhook-rutina: verify exception", err);
    return json({ error: "Verification error" }, 500);
  }

  if (payment.status !== "succeeded" || payment.paid !== true) {
    return json({ received: true, ignored: true, reason: "Payment not succeeded" });
  }

  const meta = payment.metadata ?? {};
  if ((meta.project || "rutina") !== PROJECT) {
    return json({ received: true, ignored: true, reason: "Other project" });
  }
  const userId: string | undefined = meta.userId;
  const plan: string = meta.plan || "monthly";
  const email: string | null = meta.email || null;
  // В Rutina один тариф (500 ₽ в месяц), название плана с клиента может отличаться
  const tariff = PLANS[plan] ?? PLANS.monthly;
  if (!userId || !tariff) {
    console.error(`yookassa-webhook-rutina: bad metadata ${paymentId}`, meta);
    return json({ error: "Invalid metadata" }, 400);
  }

  // 2. Сумма должна совпадать с тарифом
  if (payment.amount?.value !== tariff.amount || payment.amount?.currency !== "RUB") {
    console.error(`yookassa-webhook-rutina: amount mismatch ${paymentId}: ${JSON.stringify(payment.amount)} plan=${plan}`);
    return json({ error: "Amount does not match plan" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 3. Идемпотентность
  const markerKey = `yk_payment:${paymentId}`;
  const { data: seen } = await supabase.from(KV_TABLE).select("key").eq("key", markerKey).maybeSingle();
  if (seen) return json({ received: true, ignored: true, reason: "Already processed" });

  // 4. Продление от текущей даты окончания, если доступ к проекту ещё активен
  const { data: current } = await supabase
    .from("user_access")
    .select("status, expires_at")
    .eq("user_id", userId)
    .eq("project", PROJECT)
    .maybeSingle();

  const now = new Date();
  const currentExpiry = current?.expires_at ? new Date(current.expires_at) : null;
  const base = current?.status === "active" && currentExpiry && currentExpiry > now ? currentExpiry : now;
  const expiresAt = new Date(base);
  if (tariff.days) expiresAt.setDate(expiresAt.getDate() + tariff.days);
  if (tariff.months) expiresAt.setMonth(expiresAt.getMonth() + tariff.months);
  if (tariff.years) expiresAt.setFullYear(expiresAt.getFullYear() + tariff.years);

  const { error } = await supabase.from("user_access").upsert(
    {
      user_id: userId,
      email,
      project: PROJECT,
      plan,
      status: "active",
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id,project" },
  );
  if (error) {
    console.error("yookassa-webhook-rutina: user_access upsert error", error);
    return json({ error: error.message }, 500); // ЮKassa повторит уведомление
  }

  await supabase.from(KV_TABLE).upsert({
    key: markerKey,
    value: { project: PROJECT, userId, plan, processedAt: now.toISOString() },
  });

  console.log(`yookassa-webhook-rutina: access granted user=${userId} plan=${plan} until=${expiresAt.toISOString()} payment=${paymentId}`);
  return json({ received: true, success: true });
});
