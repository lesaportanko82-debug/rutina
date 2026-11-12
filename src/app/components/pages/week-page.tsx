import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { AppIcon } from "../app-icon";
import { DayStripe, buildStripe } from "../day-stripe";
import { InkLeaf } from "../ink-leaf";
import { lastNDates } from "../../lib/consistency";
import { markWeekReviewDone } from "../../lib/week";

/**
 * Разбор недели: неделя одним взглядом, один вопрос, одна настройка.
 * Намеренно короткий — ритуал на две минуты, а не отчёт.
 */

const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const PART_LABEL = { morning: "Утро", day: "День", evening: "Вечер" } as const;

export function WeekPage() {
  const { habits, tasks, moods, addJournalEntry, setHabitTimeOfDay } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState("");
  const [adjusted, setAdjusted] = useState<null | "moved" | "kept">(null);

  const days = useMemo(() => lastNDates(7), []);
  const hair = `0.5px solid ${t.borderLight}`;
  const card: React.CSSProperties = {};
  const title: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 700, color: t.text };

  const perHabit = useMemo(
    () =>
      habits
        .map((h) => ({ habit: h, done: days.filter((d) => h.completedDates.includes(d)).length }))
        .sort((a, b) => b.done - a.done),
    [habits, days]
  );
  const best = perHabit[0];
  const weakest = perHabit.length > 1 ? perHabit[perHabit.length - 1] : undefined;

  const weekMoods = moods.filter((m) => days.includes(m.date));
  const topMood = useMemo(() => {
    const c = new Map<string, number>();
    for (const m of weekMoods) c.set(m.mood, (c.get(m.mood) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [weekMoods]);

  const tasksDone = tasks.filter((x) => x.completed).length;

  const finish = () => {
    if (answer.trim()) addJournalEntry(`Разбор недели. Что помогло: ${answer.trim()}`);
    markWeekReviewDone();
    toast.success("Неделя закрыта");
    navigate("/app");
  };

  return (
    <div style={{ paddingLeft: 22, paddingRight: 22, paddingTop: 26, paddingBottom: 32 }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 mb-4" style={{ fontSize: "0.82rem", color: t.textMuted }}>
        <ChevronLeft size={16} /> Назад
      </button>
      <div className="flex items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="display" style={{ fontSize: "1.35rem", color: t.text, marginBottom: 4 }}>Разбор недели</h1>
          <p style={{ fontSize: "0.85rem", color: t.textSecondary }}>Две минуты: посмотреть, ответить, поправить.</p>
        </div>
        <InkLeaf mood="near" size={54} />
      </div>

      {/* 1. Неделя одним взглядом */}
      <div style={{ marginTop: 36, marginBottom: 40 }}>
        <span style={title}>Как прошла неделя</span>
        <div className="mt-3" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {days.map((d) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.7rem", color: t.textMuted, width: 18 }}>{WD[new Date(d + "T12:00:00").getDay()]}</span>
              <DayStripe parts={buildStripe(d, habits, tasks)} height={8} gap={3} />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1.5" style={{ fontSize: "0.84rem", color: t.textSecondary }}>
          {best && best.done > 0 && (
            <p>Лучше всего шло: <b style={{ color: t.text }}>{best.habit.title}</b> — {best.done} из 7 дней.</p>
          )}
          {topMood && <p>Чаще всего настроение: <b style={{ color: t.text }}>{topMood[0].toLowerCase()}</b> ({topMood[1]} дн.).</p>}
          {tasksDone > 0 && <p>Закрыто задач всего: <b style={{ color: t.text }}>{tasksDone}</b>.</p>}
          {habits.length === 0 && weekMoods.length === 0 && <p>На этой неделе записей почти нет — это тоже информация.</p>}
        </div>
      </div>

      {/* 2. Один вопрос */}
      <div style={{ marginBottom: 40, paddingTop: 24, borderTop: hair }}>
        <span style={title}>Что на этой неделе помогло больше всего?</span>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Одно-два предложения. Ответ сохранится в дневник."
          rows={3}
          className="w-full mt-3 p-3 rounded-lg outline-none resize-none"
          style={{ background: t.bgSecondary, border: "none", color: t.text }}
        />
      </div>

      {/* 3. Одна настройка */}
      {weakest && weakest.done <= 3 && (
        <div style={{ marginBottom: 40, paddingTop: 24, borderTop: hair }}>
          <span style={title}>Одна настройка на следующую неделю</span>
          <div className="flex items-center gap-2 mt-3 mb-1">
            <AppIcon icon={weakest.habit.icon} size={16} color={weakest.habit.color} />
            <span style={{ fontSize: "0.88rem", color: t.text }}>
              «{weakest.habit.title}» — {weakest.done} из 7
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: t.textMuted, marginBottom: 10 }}>
            Возможно, ей не подходит время. Попробовать другую часть дня?
          </p>
          {adjusted ? (
            <p style={{ fontSize: "0.82rem", color: "#5B8A64", fontWeight: 600 }}>{adjusted === "moved" ? "Перенесено. Посмотрим через неделю." : "Оставили как есть."}</p>
          ) : (
            <div className="flex gap-2">
              {(Object.keys(PART_LABEL) as (keyof typeof PART_LABEL)[])
                .filter((k) => k !== (weakest.habit.timeOfDay ?? "day"))
                .map((k) => (
                  <button
                    key={k}
                    onClick={() => { setHabitTimeOfDay(weakest.habit.id, k); setAdjusted("moved"); }}
                    className="flex-1 py-2 rounded-lg"
                    style={{ background: t.bgSecondary, border: `1px solid ${t.border}`, fontSize: "0.8rem", color: t.text }}
                  >
                    {PART_LABEL[k]}
                  </button>
                ))}
              <button
                onClick={() => setAdjusted("kept")}
                className="flex-1 py-2 rounded-lg"
                style={{ border: `1px solid ${t.border}`, fontSize: "0.8rem", color: t.textMuted }}
              >
                Оставить
              </button>
            </div>
          )}
        </div>
      )}

      <button onClick={finish} className="w-full py-3 rounded-xl" style={{ background: "#5B8A64", color: "#fff", fontWeight: 600 }}>
        Закрыть неделю
      </button>
    </div>
  );
}
