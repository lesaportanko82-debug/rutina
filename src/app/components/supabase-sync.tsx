import { projectId, publicAnonKey } from "./supabase-client";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ff738703`;

// ─── User-based sync key ───
// We use the authenticated user's Supabase Auth ID as the sync key.
// This ensures data follows the account, not the device.

function getUserId(): string | null {
  try {
    const raw = localStorage.getItem("routine_auth_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.id && parsed.id !== "admin") return parsed.id;
    }
  } catch {}
  return null;
}

// Map from localStorage keys to server keys
const KEY_MAP: Record<string, string> = {
  routine_tasks: "tasks",
  routine_habits: "habits",
  routine_moods: "moods",
  routine_profile: "profile",
  routine_pomodoro: "pomodoro",
  routine_reminders: "reminders",
  routine_pomodoro_stats: "pomodoro_stats",
  routine_questionnaire: "questionnaire",
  routine_dark_mode: "dark_mode",
  routine_journal: "journal",
  routine_onboarding: "onboarding",
  routine_seen_tours: "seen_tours",
  routine_seen_tips: "seen_tips",
  routine_intentions: "intentions",
  routine_evening_checkins: "evening_checkins",
  routine_anxiety: "anxiety",
  routine_plant: "plant",
  routine_worries: "worries",
  routine_bingo: "bingo",
  routine_cog_distortions: "cog_distortions",
  routine_sos: "sos",
  routine_challenges: "challenges",
  routine_lifewheel: "lifewheel",
  routine_capsules: "capsules",
  routine_soft_achievements: "soft_achievements",
  routine_focus_habit: "focus_habit",
  routine_sleep: "sleep",
  routine_favorite_tools: "favorite_tools",
  leaf_chat_history: "chat_history",
};

const REVERSE_MAP: Record<string, string> = {};
for (const [localKey, serverKey] of Object.entries(KEY_MAP)) {
  REVERSE_MAP[serverKey] = localKey;
}

// All localStorage keys that belong to a user's data
export const ALL_USER_KEYS = Object.keys(KEY_MAP);

// ─── Load all data from server for a user ───
export async function loadFromServer(userId?: string): Promise<Record<string, any> | null> {
  const uid = userId || getUserId();
  if (!uid) {
    console.log("Supabase sync: no user ID, skipping load");
    return null;
  }
  try {
    const res = await fetch(`${BASE}/state/${uid}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    });
    if (!res.ok) {
      console.log(`Supabase load failed: ${res.status} ${await res.text()}`);
      return null;
    }
    const json = await res.json();
    return json.data || null;
  } catch (e) {
    console.log(`Supabase load error: ${e}`);
    return null;
  }
}

// ─── Save to server (debounced, batched) ───
let pendingUpdates: Record<string, any> = {};
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function flushToServer() {
  const uid = getUserId();
  if (!uid) return;

  const updates = { ...pendingUpdates };
  pendingUpdates = {};

  if (Object.keys(updates).length === 0) return;

  try {
    const res = await fetch(`${BASE}/state/${uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      console.log(`Supabase save failed: ${res.status} ${await res.text()}`);
    }
  } catch (e) {
    console.log(`Supabase save error: ${e}`);
  }
}

export function syncToServer(localStorageKey: string, value: any) {
  const serverKey = KEY_MAP[localStorageKey];
  if (!serverKey) return;
  if (!getUserId()) return; // Don't sync if not logged in

  pendingUpdates[serverKey] = value;

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushToServer, 1500); // debounce 1.5s
}

// Force flush immediately (e.g. before page unload)
export function flushSync() {
  if (saveTimer) clearTimeout(saveTimer);
  flushToServer();
}

// ─── Apply server data into localStorage ───
export function applyServerData(serverData: Record<string, any>): boolean {
  let applied = false;
  for (const [serverKey, value] of Object.entries(serverData)) {
    const localKey = REVERSE_MAP[serverKey];
    if (!localKey) continue;
    if (value !== null && value !== undefined) {
      localStorage.setItem(localKey, JSON.stringify(value));
      applied = true;
    }
  }
  return applied;
}

// ─── Merge: server wins for missing local, local wins for existing ───
export function mergeServerData(serverData: Record<string, any>): boolean {
  let merged = false;
  for (const [serverKey, value] of Object.entries(serverData)) {
    const localKey = REVERSE_MAP[serverKey];
    if (!localKey) continue;

    const localRaw = localStorage.getItem(localKey);
    if (!localRaw) {
      // No local data, use server data
      localStorage.setItem(localKey, JSON.stringify(value));
      merged = true;
    }
    // If local data exists, local wins (user may have made changes offline)
  }
  return merged;
}

// ─── Initial sync on app load ───
export async function initialSync(): Promise<boolean> {
  const uid = getUserId();
  if (!uid) return false;

  const serverData = await loadFromServer(uid);
  if (serverData && Object.keys(serverData).length > 0) {
    return mergeServerData(serverData);
  }
  // No server data — push local to server
  pushAllLocalToServer();
  return false;
}

// ─── Push all current localStorage to server ───
export function pushAllLocalToServer() {
  const uid = getUserId();
  if (!uid) return;

  const allLocal: Record<string, any> = {};
  for (const [localKey, serverKey] of Object.entries(KEY_MAP)) {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        allLocal[serverKey] = JSON.parse(raw);
      } catch {}
    }
  }
  if (Object.keys(allLocal).length > 0) {
    pendingUpdates = { ...pendingUpdates, ...allLocal };
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flushToServer, 500);
  }
}

// ─── Full server load: overwrite localStorage with server data ───
// Used on login to restore user's data from the cloud
export async function fullLoadFromServer(userId: string): Promise<boolean> {
  const serverData = await loadFromServer(userId);
  if (serverData && Object.keys(serverData).length > 0) {
    return applyServerData(serverData);
  }
  return false;
}

// ─── Clear all user data from localStorage ───
export function clearLocalUserData() {
  for (const key of ALL_USER_KEYS) {
    localStorage.removeItem(key);
  }
  // Also clear some extra keys
  localStorage.removeItem("routine_avatar_url");
  localStorage.removeItem("routine_auth_user");
}