import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, ChevronRight, Timer } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { AppIcon } from "../app-icon";
import { DayStripe, buildStripe } from "../day-stripe";
import { InkCheck, InkFace } from "../ink";
import { InkLeaf, leafMoodForHour } from "../ink-leaf";
import { consistency } from "../../lib/consistency";
import { computeInsights } from "../../lib/insights";
import { weekReviewDone } from "../../lib/week";
import { type as T, space as S, motion as M } from "../../lib/design";

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

  const name = questionnaire.filled && questionnaire.name ? questionnaire.name : profile.name;
  const todayMood = moods.find((m) => m.date === d);
  const wd = new Date().getDay();
  const showWeekReview = (wd === 0 || wd === 1) && (habits.length > 0 || moods.length > 0) && !weekReviewDone();
  const suggestion = todayMood ? MOOD_PRACTICE[todayMood.mood] : undefined;
  const insight = useMemo(() => computeInsights(habits, moods, anxietyEntries), [habits, moods, anxietyEntries]);
  const stripe = useMemo(() => buildStripe(d, habits, tasks, reminders), [d, habits, tasks, reminders]);
  const openTasks = useMemo(() => tasks.filter((x) => !x.completed), [tasks]);
  const habitsDone = habits.filter((h) => h.completedDates.includes(d)).length;

  const done = habits.length + openTasks.length > 0;
  const hair = `0.5px solid ${t.borderLight}`;
  const sectionLabel: React.CSSProperties = {
    fontSize: T.micro,
    color: t.textMuted,
    letterSpacing: "0.02em",
    marginBottom: S.tight,
  };
  const pickMood = (m: (typeof MOODS)[number]) => {
    addMoodEntry(m.name, m.color, 3);
    setMoodSaved(true);
  };

  /** Строка списка: живёт на бумаге, разделена волосяной линией */
  const Row = ({
    checked,
    onToggle,
    icon,
    title,
    trailing,
    last,
  }: {
    checked: boolean;
    onToggle: () => void;
    icon?: React.ReactNode;
    title: string;
    trailing?: React.ReactNode;
    last?: boolean;
  }) => (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.985 }}
      transition={M.press}
      className="w-full flex items-center text-left"
      style={{ gap: S.inner, paddingTop: 13, paddingBottom: 13, borderBottom: last ? "none" : hair }}
    >
      <span
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          width: 23,
          height: 23,
          border: `1.5px solid ${checked ? t.accent : t.control}`,
          background: checked ? t.accent : "transparent",
        }}
      >
        {checked && <InkCheck size={14} />}
      </span>
      {icon}
      <span
        className="flex-1"
        style={{ fontSize: T.body, color: checked ? t.textMuted : t.text, textDecoration: checked ? "line-through" : "none" }}
      >
        {title}
      </span>
      {trailing}
    </motion.button>
  );

  return (
    <div style={{ paddingLeft: 22, paddingRight: 22, paddingTop: 26, paddingBottom: 32 }}>
      {/* Шапка: дата, приветствие, Листик и полоса дня — один блок статуса */}
      <div className="flex items-start justify-between" style={{ gap: S.inner }}>
        <div style={{ paddingTop: 2 }}>
          <p style={{ fontSize: T.micro, color: t.textMuted, textTransform: "capitalize" }}>{dateLabel()}</p>
          <h1 className="display" style={{ fontSize: "1.7rem", color: t.ink, lineHeight: 1.12, marginTop: 3 }}>
            {greeting()}
            {name && name !== "Пользователь" ? <>,&nbsp;{name}</> : ""}
          </h1>
        </div>
        <InkLeaf mood={leafMoodForHour(new Date().getHours())} size={58} />
      </div>

      <button onClick={() => navigate("/app/day")} className="w-full text-left" style={{ marginTop: S.group }}>
        <DayStripe parts={stripe} highlight={nowPart} height={9} celebrate />
        <div className="flex" style={{ marginTop: 7 }}>
          {DAY_PARTS.map((p) => {
            const isNow = p.key === nowPart;
            const part = stripe.find((s) => s.key === p.key);
            return (
              <span key={p.key} className="flex-1" style={{ fontSize: T.micro, color: isNow ? t.text : t.textMuted, fontWeight: isNow ? 700 : 500 }}>
                {p.label}
                {part && part.total > 0 && <span style={{ color: t.textMuted, fontWeight: 500 }}> {part.done}/{part.total}</span>}
              </span>
            );
          })}
        </div>
      </button>

      {/* Разбор недели — в воскресенье и понедельник */}
      {showWeekReview && (
        <button
          onClick={() => navigate("/app/week")}
          className="w-full flex items-center justify-between"
          style={{ marginTop: S.group, paddingTop: S.inner, paddingBottom: S.inner, borderTop: hair, borderBottom: hair }}
        >
          <span>
            <span style={{ display: "block", fontSize: T.body, fontWeight: 700, color: t.text }}>Разбор недели</span>
            <span style={{ fontSize: T.small, color: t.textMuted }}>Две минуты, чтобы закрыть неделю</span>
          </span>
          <ChevronRight size={17} color={t.textMuted} />
        </button>
      )}

      {/* Настроение: действие в одно касание. Отмечено — сворачивается в строку */}
      <div style={{ marginTop: S.section }}>
        {todayMood || moodSaved ? (
          <>
            <div className="flex items-center" style={{ gap: S.tight }}>
              <InkFace mood={todayMood?.mood ?? "Спокойствие"} size={20} color={t.textSecondary} />
              <span style={{ fontSize: T.small, color: t.textSecondary }}>
                Сегодня: {(todayMood?.mood ?? "записано").toLowerCase()}
              </span>
              <button onClick={() => navigate("/app/mood")} style={{ fontSize: T.small, color: t.accent, fontWeight: 600 }}>
                Изменить
              </button>
            </div>
            {suggestion && (
              <div style={{ marginTop: S.inner, paddingTop: S.inner, borderTop: hair }}>
                <p style={{ fontSize: T.body, color: t.text, marginBottom: S.tight + 2, lineHeight: 1.45 }}>{suggestion.text}</p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={M.press}
                  onClick={() => (suggestion.event ? document.dispatchEvent(new CustomEvent(suggestion.event)) : navigate(suggestion.path!))}
                  className="rounded-lg"
                  style={{ background: t.accent, color: t.onInk, fontSize: T.small, fontWeight: 600, padding: "9px 14px" }}
                >
                  {suggestion.action}
                </motion.button>
              </div>
            )}
          </>
        ) : (
          <>
            <p style={sectionLabel}>Как вы сейчас?</p>
            <div className="flex" style={{ gap: 6 }}>
              {MOODS.map((m) => (
                <motion.button
                  key={m.name}
                  onClick={() => pickMood(m)}
                  whileTap={{ scale: 0.93 }}
                  transition={M.press}
                  className="flex-1 flex flex-col items-center rounded-xl"
                  style={{ gap: 5, paddingTop: 11, paddingBottom: 9, background: t.bgSecondary, opacity: 0.95 }}
                  aria-label={m.name}
                >
                  <InkFace mood={m.name} size={27} color={t.text} tint={m.color} />
                  <span style={{ fontSize: "0.6rem", color: t.textMuted }}>{m.name}</span>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Главное: список сегодняшнего */}
      <div style={{ marginTop: S.section }}>
        <div className="flex items-baseline justify-between" style={{ marginBottom: S.tight }}>
          <p style={sectionLabel}>Привычки</p>
          <div className="flex items-baseline" style={{ gap: S.inner }}>
            {habits.length > 0 && (
              <span style={{ fontSize: T.small, color: t.textMuted, fontWeight: 500 }}>
                {habitsDone}/{habits.length}
              </span>
            )}
            <button onClick={() => navigate("/app/habits")} style={{ fontSize: T.micro, color: t.textMuted }}>
              Все
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <button
            onClick={() => navigate("/app/habits")}
            className="w-full flex items-center"
            style={{ gap: S.inner, paddingTop: 13, paddingBottom: 13, borderTop: hair, borderBottom: hair }}
          >
            <Plus size={18} color={t.accent} />
            <span style={{ fontSize: T.body, color: t.text }}>Добавить первую привычку</span>
          </button>
        ) : (
          <div style={{ borderTop: hair }}>
            {habits.map((h, i) => {
              const checked = h.completedDates.includes(d);
              const c = consistency(h);
              return (
                <Row
                  key={h.id}
                  checked={checked}
                  onToggle={() => toggleHabitToday(h.id)}
                  icon={<AppIcon icon={h.icon} size={17} color={t.textSecondary} />}
                  title={h.title}
                  last={i === habits.length - 1}
                  trailing={
                    c.window >= 5 ? (
                      <span style={{ fontSize: T.micro, color: t.textFaint, fontWeight: 400 }}>{c.percent}%</span>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Задачи */}
      <div style={{ marginTop: S.group }}>
        <div className="flex items-baseline justify-between" style={{ marginBottom: S.tight }}>
          <p style={sectionLabel}>Задачи</p>
          <div className="flex items-center" style={{ gap: S.inner }}>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("open-pomodoro"))}
              className="flex items-center"
              style={{ gap: 4, fontSize: T.micro, color: t.textMuted }}
              aria-label="Таймер фокуса"
            >
              <Timer size={13} /> Фокус
            </button>
            <button onClick={() => navigate("/app/tasks")} style={{ fontSize: T.micro, color: t.textMuted }}>
              Все
            </button>
          </div>
        </div>

        {openTasks.length === 0 ? (
          <button
            onClick={() => navigate("/app/tasks")}
            className="w-full flex items-center"
            style={{ gap: S.inner, paddingTop: 13, paddingBottom: 13, borderTop: hair, borderBottom: hair }}
          >
            <Plus size={18} color={t.accent} />
            <span style={{ fontSize: T.body, color: t.text }}>
              {tasks.length === 0 ? "Добавить задачу" : "Всё выполнено. Добавить ещё"}
            </span>
          </button>
        ) : (
          <div style={{ borderTop: hair }}>
            {openTasks.slice(0, 5).map((task, i) => (
              <Row
                key={task.id}
                checked={false}
                onToggle={() => toggleTask(task.id)}
                title={task.title}
                last={i === Math.min(openTasks.length, 5) - 1 && openTasks.length <= 5}
                trailing={
                  task.priority === "high" ? (
                    <span style={{ fontSize: T.micro, color: t.attention, fontWeight: 600 }}>важно</span>
                  ) : undefined
                }
              />
            ))}
            {openTasks.length > 5 && (
              <button
                onClick={() => navigate("/app/tasks")}
                className="w-full text-left"
                style={{ fontSize: T.small, color: t.textMuted, paddingTop: 12, paddingBottom: 2 }}
              >
                Ещё {openTasks.length - 5}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Наблюдения — контекст, а не задача, поэтому ниже списка */}
      {(insight.insights.length > 0 || (insight.daysCollected >= 3 && insight.daysCollected < insight.daysNeeded)) && (
        <div style={{ marginTop: S.section }}>
          <p style={sectionLabel}>Наблюдения</p>
          {insight.insights.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: S.inner }}>
              {insight.insights.map((it) => (
                <div key={it.id}>
                  <p style={{ fontSize: T.body, color: t.text, lineHeight: 1.5 }}>{it.text}</p>
                  <p style={{ fontSize: T.micro, color: t.textFaint, marginTop: 3 }}>{it.basis}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: T.small, color: t.textSecondary, lineHeight: 1.5 }}>
              Пока собираю данные: {insight.daysCollected} из {insight.daysNeeded} дней с настроением. Раньше любые выводы были бы догадкой.
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => navigate("/app/practices")}
        className="w-full flex items-center justify-between"
        style={{ marginTop: S.section, paddingTop: S.inner, borderTop: hair }}
      >
        <span style={{ fontSize: T.small, color: t.textSecondary }}>Практики: дыхание, заземление, дневник</span>
        <ChevronRight size={16} color={t.textMuted} />
      </button>

      {!done && <div style={{ height: S.group }} />}
    </div>
  );
}
