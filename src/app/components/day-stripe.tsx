import { useTheme, phaseAt, type DayPhase } from "./theme";
import type { Habit, Task, Reminder } from "./use-app-store";

/**
 * Полоса дня — единственный графический примитив приложения.
 * Утро, день, вечер слева направо; заполнение = доля выполненного.
 * Та же форма работает и как сегодняшний день на главной,
 * и как один день месяца в ряду из тридцати.
 */

export type StripePart = { key: DayPhase; done: number; total: number };

const ORDER: Exclude<DayPhase, "night">[] = ["morning", "day", "evening"];

/** Считает заполнение полосы за конкретную дату. */
export function buildStripe(
  date: string,
  habits: Habit[],
  tasks: Task[] = [],
  reminders: Reminder[] = []
): StripePart[] {
  const weekday = new Date(date + "T12:00:00").getDay();
  return ORDER.map((key) => {
    const part = habits.filter((h) => (h.timeOfDay ?? "day") === key);
    const done = part.filter((h) => h.completedDates.includes(date)).length;
    let total = part.length;
    let completed = done;

    if (key === "day") {
      const due = tasks.filter((t) => t.dueDate === date);
      total += due.length;
      completed += due.filter((t) => t.completed).length;
    }
    // напоминания не «выполняются», но показывают, что в этой части дня что-то запланировано
    if (total === 0) {
      const planned = reminders.filter(
        (r) => r.enabled && (!r.days.length || r.days.includes(weekday)) && phaseAt(Number(r.time.split(":")[0])) === key
      );
      total = planned.length ? 1 : 0;
    }
    return { key, done: completed, total };
  });
}

export function DayStripe({
  parts,
  height = 10,
  gap = 3,
  radius = 3,
  highlight,
  muted = false,
}: {
  parts: StripePart[];
  height?: number;
  gap?: number;
  radius?: number;
  /** Часть суток, которую подсветить рамкой (обычно текущая) */
  highlight?: DayPhase;
  /** Приглушённый вариант — для рядов из многих дней */
  muted?: boolean;
}) {
  const t = useTheme();
  const fill = muted ? "#7FA98A" : "#5B8A64";

  return (
    <div style={{ display: "flex", gap, width: "100%" }} aria-hidden>
      {parts.map((p) => {
        const ratio = p.total > 0 ? p.done / p.total : 0;
        const isHighlight = highlight === p.key;
        return (
          <div
            key={p.key}
            style={{
              flex: 1,
              height,
              borderRadius: radius,
              background: p.total === 0 ? t.bgSecondary : t.borderLight,
              overflow: "hidden",
              position: "relative",
              outline: isHighlight ? `1.5px solid ${fill}` : "none",
              outlineOffset: 1.5,
            }}
          >
            <div
              style={{
                width: `${Math.round(ratio * 100)}%`,
                height: "100%",
                background: fill,
                borderRadius: radius,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Ряд из многих дней: месяц становится текстурой, которую видно одним взглядом. */
export function StripeMonth({
  days,
  habits,
  tasks = [],
}: {
  days: string[];
  habits: Habit[];
  tasks?: Task[];
}) {
  const t = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {days.map((d, i) => (
        <div key={d} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.56rem", lineHeight: 1, color: t.textFaint, width: 16, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
            {i === 0 || i === days.length - 1 || new Date(d + "T12:00:00").getDay() === 1 ? Number(d.slice(8, 10)) : ""}
          </span>
          <DayStripe parts={buildStripe(d, habits, tasks)} height={4} gap={2} radius={2} muted />
        </div>
      ))}
    </div>
  );
}
