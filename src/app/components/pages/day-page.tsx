import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Check, ChevronLeft, Clock, Sun, Sunset, Sunrise } from "lucide-react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { AppIcon } from "../app-icon";

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

  const card: React.CSSProperties = { background: t.card, border: `1px solid ${t.border}`, borderRadius: 12 };

  const grouped = useMemo(() => {
    const out: Record<Part, { habits: typeof habits; reminders: typeof reminders; tasks: typeof tasks }> = {
      morning: { habits: [], reminders: [], tasks: [] },
      day: { habits: [], reminders: [], tasks: [] },
      evening: { habits: [], reminders: [], tasks: [] },
    };
    for (const h of habits) if (h.timeOfDay) out[h.timeOfDay].habits.push(h);
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

  const unplaced = habits.filter((h) => !h.timeOfDay);

  return (
    <div className="px-5 pt-6 pb-8">
      <button onClick={() => navigate("/app")} className="flex items-center gap-1 mb-4" style={{ fontSize: "0.82rem", color: t.textMuted }}>
        <ChevronLeft size={16} /> Сегодня
      </button>

      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text, marginBottom: 4 }}>Ритм дня</h1>
      <p style={{ fontSize: "0.85rem", color: t.textSecondary, marginBottom: 20 }}>
        Привычки и напоминания, разложенные по частям дня.
      </p>

      <div className="space-y-4">
        {PARTS.map(({ key, label, hint, icon: Icon }) => {
          const g = grouped[key];
          const isNow = key === now;
          const empty = g.habits.length === 0 && g.reminders.length === 0 && g.tasks.length === 0;
          return (
            <div key={key} className="p-4" style={{ ...card, borderColor: isNow ? "#5B8A64" : t.border }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} color={isNow ? "#5B8A64" : t.textMuted} />
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: t.text }}>{label}</span>
                <span style={{ fontSize: "0.72rem", color: t.textMuted }}>{hint}</span>
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
                    return (
                      <button
                        key={h.id}
                        onClick={() => toggleHabitToday(h.id)}
                        className="w-full flex items-center gap-3 text-left"
                        style={{ opacity: done ? 0.6 : 1 }}
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ border: `1.5px solid ${done ? "#5B8A64" : t.borderLight}`, background: done ? "#5B8A64" : "transparent" }}
                        >
                          {done && <Check size={12} color="white" strokeWidth={3} />}
                        </span>
                        <AppIcon icon={h.icon} size={16} color={h.color} />
                        <span style={{ fontSize: "0.88rem", color: t.text, textDecoration: done ? "line-through" : "none" }}>
                          {h.title}
                        </span>
                      </button>
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

      {unplaced.length > 0 && (
        <div className="mt-5">
          <p style={{ fontSize: "0.88rem", fontWeight: 700, color: t.text, marginBottom: 4 }}>Без части дня</p>
          <p style={{ fontSize: "0.8rem", color: t.textMuted, marginBottom: 10 }}>
            Выберите, когда вам удобнее это делать — привычка встанет в нужное место дня.
          </p>
          <div className="space-y-2">
            {unplaced.map((h) => (
              <div key={h.id} className="px-4 py-3" style={card}>
                <div className="flex items-center gap-2 mb-2">
                  <AppIcon icon={h.icon} size={16} color={h.color} />
                  <span style={{ fontSize: "0.88rem", color: t.text }}>{h.title}</span>
                </div>
                <div className="flex gap-2">
                  {PARTS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setHabitTimeOfDay(h.id, p.key)}
                      className="flex-1 py-2 rounded-lg"
                      style={{ background: t.bgSecondary, border: `1px solid ${t.border}`, fontSize: "0.78rem", color: t.text }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reminders.length === 0 && (
        <button onClick={() => navigate("/app/notifications")} className="w-full mt-4 px-4 py-3 text-left" style={card}>
          <span style={{ fontSize: "0.86rem", color: t.text }}>Добавить напоминание ко времени →</span>
        </button>
      )}
    </div>
  );
}
