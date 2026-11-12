import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ЮKassa отключена: магазин не активен. Включить — секрет PAYMENTS_ENABLED=true.
  if (Deno.env.get("PAYMENTS_ENABLED") !== "true") {
    return new Response(JSON.stringify({ success: false, error: "Оплата временно отключена" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { userId, email, plan, returnUrl } = await req.json();

    const shopId = Deno.env.get("YOOKASSA_SHOP_ID_RUTINA");
    const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY_RUTINA");
    const siteUrl = Deno.env.get("SITE_URL_RUTINA");

    if (!shopId || !secretKey) {
      throw new Error("Missing Rutina YooKassa secrets");
    }
    if (!userId) {
      throw new Error("Missing userId");
    }

    const finalReturnUrl = siteUrl ? `${siteUrl.replace(/\/$/, "")}/success` : returnUrl;
    if (!finalReturnUrl) {
      throw new Error("Missing return URL (set SITE_URL_RUTINA)");
    }

    const amount = "500.00";
    const description = "Оплата подписки Rutina";
    const auth = btoa(`${shopId}:${secretKey}`);

    const paymentResponse = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
        "Idempotence-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        amount: { value: amount, currency: "RUB" },
        capture: true,
        confirmation: { type: "redirect", return_url: finalReturnUrl },
        description,
        metadata: {
          project: "rutina",
          userId,
          email: email || "",
          plan: plan || "monthly",
        },
      }),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      console.error("YooKassa error:", paymentData);
      throw new Error(paymentData?.description || "YooKassa payment creation failed");
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.id,
        confirmationUrl: paymentData.confirmation.confirmation_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("create-payment-rutina error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
