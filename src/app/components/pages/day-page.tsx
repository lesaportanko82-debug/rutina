import { useMemo } from "react";
import { InkCheck } from "../ink";
import { useNavigate } from "react-router";
import { Check, ChevronLeft, Clock, Sun, Sunset, Sunrise } from "lucide-react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { AppIcon } from "../app-icon";
import { DayStripe, buildStripe } from "../day-stripe";

const today = () => new Date().toISOString().split("T")[0];

type Part = "morning" | "day" | "evening";

const PARTS: { key: Part; label: string; hint: string; icon: typeof Sun }[] = [
  { key: "morning", label: "Утро", hint: "до 12:00", icon: Sunrise },
  { key: "day", label: "День", hint: "12:00 – 18:00", icon: Sun },
  { key: "evening", label: "Вечер", hint: "после 18:00", icon: Sunset },
];

function partOfTime(time: string): Part {
  const h = Number(time.split(":")[0]);
  if (h < 12) return "morning";
  if (h < 18) return "day";
  return "evening";
}

export function currentPart(): Part {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "day";
  return "evening";
}

export function DayPage() {
  const { habits, tasks, reminders, toggleHabitToday, toggleTask, setHabitTimeOfDay } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const d = today();
  const now = currentPart();
  const weekday = new Date().getDay();

  const hair = `0.5px solid ${t.borderLight}`;
  const card: React.CSSProperties = { borderTop: hair, borderBottom: hair };

  const grouped = useMemo(() => {
    const out: Record<Part, { habits: typeof habits; reminders: typeof reminders; tasks: typeof tasks }> = {
      morning: { habits: [], reminders: [], tasks: [] },
      day: { habits: [], reminders: [], tasks: [] },
      evening: { habits: [], reminders: [], tasks: [] },
    };
    // Привычка без назначенной части дня живёт в «Дне» — так она видна и в полосе, и здесь
    for (const h of habits) out[h.timeOfDay ?? "day"].habits.push(h);
    for (const r of reminders) {
      if (!r.enabled) continue;
      if (r.days.length && !r.days.includes(weekday)) continue;
      out[partOfTime(r.time)].reminders.push(r);
    }
    for (const task of tasks) {
      if (task.completed || task.dueDate !== d) continue;
      out.day.tasks.push(task);
    }
    return out;
  }, [habits, reminders, tasks, d, weekday]);

  return (
    <div style={{ paddingLeft: 22, paddingRight: 22, paddingTop: 26, paddingBottom: 32 }}>
      <button onClick={() => navigate("/app")} className="flex items-center gap-1 mb-4" style={{ fontSize: "0.82rem", color: t.textMuted }}>
        <ChevronLeft size={16} /> Сегодня
      </button>

      <h1 className="display" style={{ fontSize: "1.35rem", color: t.text, marginBottom: 4 }}>Ритм дня</h1>
      <p style={{ fontSize: "0.85rem", color: t.textSecondary, marginBottom: 14 }}>
        Привычки и напоминания, разложенные по частям дня.
      </p>

      <div className="mb-5">
        <DayStripe parts={buildStripe(d, habits, tasks, reminders)} highlight={now} height={12} celebrate />
      </div>

      <div>
        {PARTS.map(({ key, label, hint, icon: Icon }) => {
          const g = grouped[key];
          const isNow = key === now;
          const empty = g.habits.length === 0 && g.reminders.length === 0 && g.tasks.length === 0;
          return (
            <div key={key} style={{ marginBottom: 32 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 10, paddingBottom: 8, borderBottom: hair }}>
                <Icon size={15} color={isNow ? "#5B8A64" : t.textMuted} strokeWidth={1.7} />
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: isNow ? t.text : t.textSecondary }}>{label}</span>
                <span style={{ fontSize: "0.72rem", color: t.textFaint }}>{hint}</span>
                {isNow && (
                  <span style={{ fontSize: "0.66rem", color: "#5B8A64", fontWeight: 600, marginLeft: "auto" }}>сейчас</span>
                )}
              </div>

              {empty ? (
                <p style={{ fontSize: "0.82rem", color: t.textMuted }}>Пока ничего не запланировано.</p>
              ) : (
                <div className="space-y-2">
                  {g.habits.map((h) => {
                    const done = h.completedDates.includes(d);
                    const unplaced = !h.timeOfDay;
                    return (
                      <div key={h.id}>
                        <button
                          onClick={() => toggleHabitToday(h.id)}
                          className="w-full flex items-center gap-3 text-left"
                          style={{ opacity: done ? 0.6 : 1 }}
                        >
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ border: `1.5px solid ${done ? "#5B8A64" : t.borderLight}`, background: done ? "#5B8A64" : "transparent" }}
                          >
                            {done && <InkCheck size={13} />}
                          </span>
                          <AppIcon icon={h.icon} size={16} color={t.textSecondary} />
                          <span style={{ fontSize: "0.88rem", color: t.text, textDecoration: done ? "line-through" : "none" }}>
                            {h.title}
                          </span>
                        </button>
                        {unplaced && (
                          <div className="flex items-center gap-1.5 mt-1.5 mb-1 pl-8">
                            <span style={{ fontSize: "0.7rem", color: t.textMuted }}>когда удобнее?</span>
                            {PARTS.map((p) => (
                              <button
                                key={p.key}
                                onClick={() => setHabitTimeOfDay(h.id, p.key)}
                                className="px-2 py-0.5 rounded-md"
                                style={{ background: t.bgSecondary, border: `1px solid ${t.border}`, fontSize: "0.7rem", color: t.textSecondary }}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {g.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="w-full flex items-center gap-3 text-left"
                    >
                      <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ border: `1.5px solid ${t.borderLight}` }} />
                      <span style={{ fontSize: "0.88rem", color: t.text }}>{task.title}</span>
                      <span style={{ fontSize: "0.68rem", color: t.textMuted, marginLeft: "auto" }}>задача</span>
                    </button>
                  ))}

                  {g.reminders.map((r) => (
                    <div key={r.id} className="flex items-center gap-3">
                      <Clock size={14} color={t.textMuted} />
                      <span style={{ fontSize: "0.88rem", color: t.textSecondary }}>{r.title}</span>
                      <span style={{ fontSize: "0.72rem", color: t.textMuted, marginLeft: "auto" }}>{r.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reminders.length === 0 && (
        <button onClick={() => navigate("/app/notifications")} className="w-full mt-4 px-4 py-3 text-left" style={card}>
          <span style={{ fontSize: "0.86rem", color: t.text }}>Добавить напоминание ко времени →</span>
        </button>
      )}
    </div>
  );
}
