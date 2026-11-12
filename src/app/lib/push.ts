import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { supabase } from "../components/supabase-client";

/** Публичный VAPID-ключ приложения (не секрет, он уходит в браузер) */
const VAPID_PUBLIC_KEY = "BFp8E1D72-A6ipKWs_KY41_z098XiaJgAatQjk3Oh0hOYeDogfUi8rJ4h2qExCRA7atLye_dGSKvELJLY6K9FJU";
const SUBSCRIBE_URL = `https://${projectId}.supabase.co/functions/v1/push-subscribe`;

export type PushReminder = { title: string; body?: string; time: string; days: number[]; enabled: boolean };

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return `Bearer ${data.session?.access_token ?? publicAnonKey}`;
}

async function postSubscription(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: await authHeader() },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Включает push: спрашивает разрешение, подписывает браузер, отправляет подписку на сервер. */
export async function enablePush(reminders: PushReminder[]): Promise<"ok" | "denied" | "unsupported" | "error"> {
  if (!pushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      }));

    const ok = await postSubscription({
      subscription: sub.toJSON(),
      reminders,
      tzOffset: -new Date().getTimezoneOffset(),
    });
    return ok ? "ok" : "error";
  } catch (e) {
    console.error("[push] subscribe failed", e);
    return "error";
  }
}

/** Отправляет на сервер обновлённый список напоминаний (если подписка уже есть). */
export async function syncReminders(reminders: PushReminder[]): Promise<void> {
  if (!pushSupported() || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await postSubscription({
      subscription: sub.toJSON(),
      reminders,
      tzOffset: -new Date().getTimezoneOffset(),
    });
  } catch {
    /* молча: напоминания не критичны для работы приложения */
  }
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await postSubscription({ subscription: sub.toJSON(), unsubscribe: true });
    await sub.unsubscribe();
  } catch {
    /* ignore */
  }
}
