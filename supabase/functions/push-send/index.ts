/**
 * Рассылает push-напоминания. Запускается по расписанию (pg_cron, каждые 5 минут).
 * Для каждой подписки смотрит её напоминания и локальное время пользователя;
 * отправляет те, чьё время совпало с текущей пятиминуткой и чей день недели подходит.
 * Шифрование по Web Push (aes128gcm) и подпись VAPID делаются здесь, без внешних библиотек.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@rutina.life";

const b64urlToBytes = (s: string): Uint8Array => {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const bytesToB64url = (b: ArrayBuffer | Uint8Array): string => {
  const arr = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (const byte of arr) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
/** Копия в свежий ArrayBuffer: типы WebCrypto/fetch требуют именно его */
const buf = (u: Uint8Array): ArrayBuffer => u.slice().buffer as ArrayBuffer;

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

/** VAPID JWT (ES256), подписанный приватным ключом из секрета */
async function vapidAuth(audience: string): Promise<string> {
  const header = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: VAPID_SUBJECT,
  })));
  const pub = b64urlToBytes(VAPID_PUBLIC);
  const jwk: JsonWebKey = {
    kty: "EC", crv: "P-256",
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d: VAPID_PRIVATE,
    ext: true,
  };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, buf(data));
  return `${header}.${payload}.${bytesToB64url(sig)}`;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", buf(ikm), "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: buf(salt), info: buf(info) }, key, length * 8);
  return new Uint8Array(bits);
}

/** Шифрование полезной нагрузки по RFC 8291 (aes128gcm) */
async function encryptPayload(payload: string, p256dhB64: string, authB64: string): Promise<Uint8Array> {
  const clientPub = b64urlToBytes(p256dhB64);
  const authSecret = b64urlToBytes(authB64);

  const localKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeys.publicKey));

  const clientKey = await crypto.subtle.importKey("raw", buf(clientPub), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, localKeys.privateKey, 256));

  const te = new TextEncoder();
  const prkInfo = concat(te.encode("WebPush: info\0"), clientPub, localPubRaw);
  const ikm = await hkdf(authSecret, shared, prkInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);

  const aesKey = await crypto.subtle.importKey("raw", buf(cek), "AES-GCM", false, ["encrypt"]);
  const body = concat(te.encode(payload), new Uint8Array([0x02])); // padding delimiter
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(nonce) }, aesKey, buf(body)));

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, new Uint8Array([localPubRaw.length]), localPubRaw, ciphertext);
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, title: string, body: string, url: string): Promise<number> {
  const payload = JSON.stringify({ title, body, url });
  const encrypted = await encryptPayload(payload, sub.p256dh, sub.auth);
  const audience = new URL(sub.endpoint).origin;
  const jwt = await vapidAuth(audience);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "3600",
      Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC}`,
    },
    body: buf(encrypted),
  });
  return res.status;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  // Функция вызывается только планировщиком: общий секрет вместо JWT
  const cronSecret = Deno.env.get("PUSH_CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: subs, error } = await supabase.from("push_subscriptions").select("*");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const nowUtcMinutes = new Date().getUTCHours() * 60 + new Date().getUTCMinutes();
  let sent = 0, removed = 0;

  for (const sub of subs ?? []) {
    // Локальное время пользователя: tz_offset в минутах (как getTimezoneOffset со знаком минус)
    const localMinutes = ((nowUtcMinutes + (sub.tz_offset ?? 0)) % 1440 + 1440) % 1440;
    const localDay = new Date(Date.now() + (sub.tz_offset ?? 0) * 60_000).getUTCDay();

    const due = (sub.reminders ?? []).filter((r: any) => {
      if (!r?.enabled || typeof r.time !== "string") return false;
      if (Array.isArray(r.days) && r.days.length && !r.days.includes(localDay)) return false;
      const [h, m] = r.time.split(":").map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return false;
      const diff = localMinutes - (h * 60 + m);
      return diff >= 0 && diff < 5; // окно запуска cron
    });

    // Защита от повторной отправки, если cron сдвинулся и окно пересеклось
    const localDateKey = new Date(Date.now() + (sub.tz_offset ?? 0) * 60_000).toISOString().slice(0, 10);
    const prevLog: string[] = Array.isArray(sub.sent_log) ? sub.sent_log : [];
    const todayLog = new Set(prevLog.filter((k) => k.startsWith(localDateKey)));
    let logChanged = false;

    for (const r of due) {
      const key = `${localDateKey}T${r.time}`;
      if (todayLog.has(key)) continue;
      try {
        const status = await sendPush(sub, r.title || "Рутина", r.body || "Пора отметить", "/app");
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          removed++;
          logChanged = false;
          break;
        } else if (status >= 200 && status < 300) {
          sent++;
          todayLog.add(key);
          logChanged = true;
        } else {
          console.error("push failed", status, sub.endpoint.slice(0, 60));
        }
      } catch (e) {
        console.error("push error", e);
      }
    }

    if (logChanged) {
      await supabase.from("push_subscriptions")
        .update({ sent_log: [...todayLog] })
        .eq("endpoint", sub.endpoint);
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, removed, subs: subs?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
