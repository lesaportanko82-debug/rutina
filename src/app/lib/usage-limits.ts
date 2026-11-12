/**
 * Дневные лимиты на платные вызовы (OpenAI): чат с Листиком и озвучка медитаций.
 * Счётчик локальный, по дню. Сбрасывается в полночь по времени устройства.
 */
const LIMITS = { chat: 20, tts: 5 } as const;
export type LimitKind = keyof typeof LIMITS;

const key = (kind: LimitKind) => `routine_limit_${kind}_${new Date().toISOString().split("T")[0]}`;

export function usageLeft(kind: LimitKind): number {
  try {
    const used = Number(localStorage.getItem(key(kind)) || 0);
    return Math.max(0, LIMITS[kind] - used);
  } catch {
    return LIMITS[kind];
  }
}

export function consumeUsage(kind: LimitKind): boolean {
  try {
    const used = Number(localStorage.getItem(key(kind)) || 0);
    if (used >= LIMITS[kind]) return false;
    localStorage.setItem(key(kind), String(used + 1));
    return true;
  } catch {
    return true;
  }
}

export const limitMessage: Record<LimitKind, string> = {
  chat: "На сегодня лимит сообщений исчерпан. Вернитесь завтра.",
  tts: "На сегодня лимит озвучки исчерпан. Текст медитации доступен без ограничений.",
};
