import { useMemo, useState } from "react";
import { InkCheck } from "../ink";
import { useNavigate } from "react-router";
import { Plus, Check, ChevronRight, Timer } from "lucide-react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { AppIcon } from "../app-icon";
import { DayStripe, buildStripe } from "../day-stripe";
import { InkFace } from "../ink";
import { InkLeaf, leafMoodForHour } from "../ink-leaf";
import { consistency } from "../../lib/consistency";
import { computeInsights } from "../../lib/insights";
import { weekReviewDone } from "../../lib/week";

const today = () => new Date().toISOString().split("T")[0];

const DAY_PARTS = [
  { key: "morning" as const, label: "Утро" },
  { key: "day" as const, label: "День" },
  { key: "evening" as const, label: "Вечер" },
];

function partNow(): "morning" | "day" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "day";
  return "evening";
}

const MOODS = [
  { name: "Радость", color: "#C4A86C" },
  { name: "Спокойствие", color: "#8DB596" },
  { name: "Задумчивость", color: "#7EA8BE" },
  { name: "Усталость", color: "#A3907A" },
  { name: "Тревога", color: "#B88FA7" },
];

/** Практика в ответ на настроение: не библиотека, а одно уместное предложение */
const MOOD_PRACTICE: Record<string, { text: string; action: string; path?: string; event?: string }> = {
  "Тревога": { text: "Тревожно — можно заземлиться за три минуты.", action: "Заземление 5-4-3-2-1", path: "/app/anxiety/grounding" },
  "Усталость": { text: "Устали — мышцам поможет короткое расслабление.", action: "Релаксация, 4 минуты", path: "/app/pmr" },
  "Раздражение": { text: "Раздражение хорошо снимает медленное дыхание.", action: "Дыхание 4-7-8", event: "open-breathing" },
  "Грусть": { text: "Грустно — иногда легче, если это записать.", action: "Открыть дневник", path: "/app/journal" },
  "Задумчивость": { text: "Много мыслей — их можно выгрузить на бумагу.", action: "Открыть дневник", path: "/app/journal" },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

function dateLabel() {
  return new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
}

export function TodayPage() {
  const { tasks, habits, moods, reminders, anxietyEntries, profile, questionnaire, toggleTask, toggleHabitToday, addMoodEntry } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const d = today();
  const [moodSaved, setMoodSaved] = useState(false);
  const nowPart = partNow();
  const insight = useMemo(() => computeInsights(habits, moods, anxietyEntries), [habits, moods, anxietyEntries]);
  const stripe = useMemo(() => buildStripe(d, habits, tasks, reminders), [d, habits, tasks, reminders]);

  const name = questionnaire.filled && questionnaire.name ? questionnaire.name : profile.name;
  const todayMood = moods.find((m) => m.date === d);
  const wd = new Date().getDay();
  const showWeekReview = (wd === 0 || wd === 1) && (habits.length > 0 || moods.length > 0) && !weekReviewDone();
  const suggestion = todayMood ? MOOD_PRACTICE[todayMood.mood] : undefined;
  const openTasks = useMemo(() => tasks.filter((x) => !x.completed), [tasks]);
  const habitsDone = habits.filter((h) => h.completedDates.includes(d)).length;

  const card: React.CSSProperties = {
    background: t.card,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
  };
  const sectionTitle: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 700, color: t.text };
  const link: React.CSSProperties = { fontSize: "0.78rem", color: t.textMuted, display: "flex", alignItems: "center", gap: 2 };

  const pickMood = (m: (typeof MOODS)[number]) => {
    addMoodEntry(m.name, m.color, 3);
    setMoodSaved(true);
  };

  return (
    <div className="px-5 pt-6 pb-8">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p style={{ fontSize: "0.8rem", color: t.textMuted, textTransform: "capitalize" }}>{dateLabel()}</p>
          <h1 className="display" style={{ fontSize: "1.3rem", color: t.text, lineHeight: 1.25 }}>
            {greeting()}{name && name !== "Пользователь" ? `, ${name}` : ""}
          </h1>
        </div>
        <InkLeaf mood={leafMoodForHour(new Date().getHours())} size={62} />
      </div>

      {/* Полоса дня */}
      <button onClick={() => navigate("/app/day")} className="w-full px-4 py-4 mb-4 text-left" style={card}>
        <DayStripe parts={stripe} highlight={nowPart} height={10} />
        <div className="flex mt-2">
          {DAY_PARTS.map((p) => {
            const isNow = p.key === nowPart;
            const part = stripe.find((s) => s.key === p.key);
            return (
              <span key={p.key} className="flex-1" style={{ fontSize: "0.72rem", color: isNow ? t.text : t.textMuted, fontWeight: isNow ? 700 : 500 }}>
                {p.label}
                {part && part.total > 0 && (
                  <span style={{ color: t.textMuted, fontWeight: 500 }}> {part.done}/{part.total}</span>
                )}
              </span>
            );
          })}
        </div>
      </button>

      {/* Mood: one tap */}
      <div className="p-4 mb-4" style={card}>
        <div className="flex items-center justify-between mb-3">
          <span style={sectionTitle}>Настроение</span>
          <button onClick={() => navigate("/app/mood")} style={link}>
            Подробнее <ChevronRight size={14} />
          </button>
        </div>
        {todayMood || moodSaved ? (
          <>
            <p style={{ fontSize: "0.85rem", color: t.textSecondary }}>
              Сегодня: {todayMood?.mood ?? "записано"}.{" "}
              <button onClick={() => navigate("/app/mood")} style={{ color: "#5B8A64", fontWeight: 600, fontSize: "inherit" }}>
                Изменить
              </button>
            </p>
            {suggestion && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                <p style={{ fontSize: "0.84rem", color: t.text, marginBottom: 8 }}>{suggestion.text}</p>
                <button
                  onClick={() => (suggestion.event ? document.dispatchEvent(new CustomEvent(suggestion.event)) : navigate(suggestion.path!))}
                  className="px-3 py-2 rounded-lg"
                  style={{ background: "#5B8A64", color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}
                >
                  {suggestion.action}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                key={m.name}
                onClick={() => pickMood(m)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl"
                style={{ background: t.bgSecondary, border: `1px solid ${t.border}` }}
                aria-label={m.name}
              >
                <InkFace mood={m.name} size={28} color={t.text} tint={m.color} />
                <span style={{ fontSize: "0.6rem", color: t.textMuted }}>{m.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Разбор недели: в воскресенье и понедельник, пока не пройден */}
      {showWeekReview && (
        <button onClick={() => navigate("/app/week")} className="w-full p-4 mb-4 text-left flex items-center justify-between" style={{ ...card, borderColor: "#5B8A64" }}>
          <span>
            <span style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: t.text }}>Разбор недели</span>
            <span style={{ fontSize: "0.78rem", color: t.textMuted }}>Две минуты, чтобы закрыть неделю</span>
          </span>
          <ChevronRight size={16} color={t.textMuted} />
        </button>
      )}

      {/* Наблюдения: приложение отвечает на данные */}
      {(insight.insights.length > 0 || (insight.daysCollected >= 3 && insight.daysCollected < insight.daysNeeded)) && (
        <div className="p-4 mb-4" style={card}>
          <span style={sectionTitle}>Наблюдения</span>
          {insight.insights.length > 0 ? (
            <div className="mt-2 space-y-3">
              {insight.insights.map((it) => (
                <div key={it.id}>
                  <p style={{ fontSize: "0.86rem", color: t.text, lineHeight: 1.45 }}>{it.text}</p>
                  <p style={{ fontSize: "0.7rem", color: t.textMuted, marginTop: 2 }}>{it.basis}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2" style={{ fontSize: "0.84rem", color: t.textSecondary, lineHeight: 1.45 }}>
              Пока собираю данные: {insight.daysCollected} из {insight.daysNeeded} дней с настроением.
              Раньше любые выводы были бы догадкой.
            </p>
          )}
        </div>
      )}

      {/* Habits */}
      <div className="flex items-center justify-between mb-2">
        <span style={sectionTitle}>
          Привычки{habits.length > 0 && <span style={{ color: t.textMuted, fontWeight: 500 }}> {habitsDone}/{habits.length}</span>}
        </span>
        <button onClick={() => navigate("/app/habits")} style={link}>
          Все <ChevronRight size={14} />
        </button>
      </div>
      {habits.length === 0 ? (
        <button onClick={() => navigate("/app/habits")} className="w-full p-4 mb-4 text-left flex items-center gap-3" style={card}>
          <Plus size={18} color="#5B8A64" />
          <span style={{ fontSize: "0.88rem", color: t.text }}>Добавить первую привычку</span>
        </button>
      ) : (
        <div className="mb-4 space-y-2">
          {habits.map((h) => {
            const done = h.completedDates.includes(d);
            return (
              <button
                key={h.id}
                onClick={() => toggleHabitToday(h.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ ...card, opacity: done ? 0.7 : 1 }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ border: `1.5px solid ${done ? "#5B8A64" : t.borderLight}`, background: done ? "#5B8A64" : "transparent" }}
                >
                  {done && <InkCheck size={15} />}
                </span>
                <AppIcon icon={h.icon} size={18} color={h.color} />
                <span className="flex-1" style={{ fontSize: "0.9rem", color: t.text, textDecoration: done ? "line-through" : "none" }}>
                  {h.title}
                </span>
                {(() => { const c = consistency(h); return c.window >= 5 ? <span style={{ fontSize: "0.72rem", color: t.textMuted }}>{c.percent}%</span> : null; })()}
              </button>
            );
          })}
        </div>
      )}

      {/* Tasks */}
      <div className="flex items-center justify-between mb-2">
        <span style={sectionTitle}>
          Задачи{openTasks.length > 0 && <span style={{ color: t.textMuted, fontWeight: 500 }}> {openTasks.length}</span>}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => document.dispatchEvent(new CustomEvent("open-pomodoro"))}
            style={link}
            aria-label="Таймер фокуса"
          >
            <Timer size={14} /> Фокус
          </button>
          <button onClick={() => navigate("/app/tasks")} style={link}>
            Все <ChevronRight size={14} />
          </button>
        </div>
      </div>
      {openTasks.length === 0 ? (
        <button onClick={() => navigate("/app/tasks")} className="w-full p-4 mb-4 text-left flex items-center gap-3" style={card}>
          <Plus size={18} color="#5B8A64" />
          <span style={{ fontSize: "0.88rem", color: t.text }}>
            {tasks.length === 0 ? "Добавить задачу" : "Все задачи выполнены. Добавить ещё"}
          </span>
        </button>
      ) : (
        <div className="mb-4 space-y-2">
          {openTasks.slice(0, 5).map((task) => (
            <div key={task.id} className="flex items-center gap-3 px-4 py-3" style={card}>
              <button
                onClick={() => toggleTask(task.id)}
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ border: `1.5px solid ${t.borderLight}` }}
                aria-label="Выполнить"
              />
              <span className="flex-1" style={{ fontSize: "0.9rem", color: t.text }}>{task.title}</span>
              {task.priority === "high" && (
                <span style={{ fontSize: "0.68rem", color: "#C4876C", fontWeight: 600 }}>важно</span>
              )}
            </div>
          ))}
          {openTasks.length > 5 && (
            <button onClick={() => navigate("/app/tasks")} className="w-full py-2 text-center" style={{ fontSize: "0.8rem", color: t.textMuted }}>
              Ещё {openTasks.length - 5}
            </button>
          )}
        </div>
      )}

      {/* Practices entry */}
      <button onClick={() => navigate("/app/practices")} className="w-full px-4 py-3 flex items-center justify-between" style={card}>
        <span style={{ fontSize: "0.88rem", color: t.text }}>Практики: дыхание, заземление, дневник</span>
        <ChevronRight size={16} color={t.textMuted} />
      </button>
    </div>
  );
}
