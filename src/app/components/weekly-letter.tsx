import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, X, ChevronRight } from "lucide-react";
import { useTheme } from "./theme";
import type { Task, Habit, MoodEntry, JournalEntry, EveningCheckin, DailyIntention } from "./use-app-store";

interface WeeklyLetterProps {
  tasks: Task[];
  habits: Habit[];
  moods: MoodEntry[];
  journalEntries: JournalEntry[];
  eveningCheckins: EveningCheckin[];
  dailyIntentions: DailyIntention[];
  profileName: string;
  profileLevel: number;
}

function getWeekRange() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return {
    start: weekAgo.toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
    startLabel: weekAgo.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
    endLabel: now.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
  };
}

function generateLetter(props: WeeklyLetterProps): { greeting: string; paragraphs: string[]; closing: string } {
  const week = getWeekRange();
  const paragraphs: string[] = [];

  // Habit stats
  const weekHabitsDone = props.habits.reduce(
    (sum, h) => sum + h.completedDates.filter((d) => d >= week.start && d <= week.end).length,
    0
  );
  const totalPossible = props.habits.length * 7;
  const habitPct = totalPossible > 0 ? Math.round((weekHabitsDone / totalPossible) * 100) : 0;

  // Best habit
  const bestHabit = props.habits.reduce((best, h) => {
    const weekCount = h.completedDates.filter((d) => d >= week.start && d <= week.end).length;
    const bestCount = best ? best.completedDates.filter((d: string) => d >= week.start && d <= week.end).length : 0;
    return weekCount > bestCount ? h : best;
  }, props.habits[0] as Habit | undefined);

  // Tasks
  const completedTasks = props.tasks.filter((t) => t.completed).length;

  // Moods
  const weekMoods = props.moods.filter((m) => m.date >= week.start && m.date <= week.end);
  const avgEnergy = weekMoods.length > 0
    ? (weekMoods.reduce((s, m) => s + m.energy, 0) / weekMoods.length).toFixed(1)
    : null;
  const dominantMood = weekMoods.length > 0
    ? weekMoods.reduce((acc, m) => {
        acc[m.mood] = (acc[m.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : null;
  const topMood = dominantMood
    ? Object.entries(dominantMood).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  // Intentions
  const weekIntentions = props.dailyIntentions.filter((i) => i.date >= week.start && i.date <= week.end);

  // Evening checkins
  const weekCheckins = props.eveningCheckins.filter((c) => c.date >= week.start && c.date <= week.end);

  // Journal
  const weekJournals = props.journalEntries.filter((j) => j.date >= week.start && j.date <= week.end);

  // Build paragraphs
  if (weekHabitsDone > 0) {
    if (habitPct >= 80) {
      paragraphs.push(
        `На этой неделе вы были с привычками ${weekHabitsDone} раз — это впечатляет! Вы показываете настоящую стабильность, и это заметно.`
      );
    } else if (habitPct >= 50) {
      paragraphs.push(
        `Вы отметили привычки ${weekHabitsDone} раз за неделю. Это больше, чем кажется — каждый раз, когда вы возвращаетесь, вы делаете выбор в пользу себя.`
      );
    } else {
      paragraphs.push(
        `На этой неделе — ${weekHabitsDone} выполненных привычек. Помните: даже маленькие шаги формируют новый путь. Вы уже на нём.`
      );
    }
  } else {
    paragraphs.push(
      "Эта неделя была тише — и это нормально. Иногда нужно просто быть, без целей и галочек. Вы всё равно важны."
    );
  }

  if (bestHabit && weekHabitsDone > 0) {
    const bestCount = bestHabit.completedDates.filter((d) => d >= week.start && d <= week.end).length;
    if (bestCount > 0) {
      paragraphs.push(
        `Самая стабильная привычка — «${bestHabit.title}» ${bestHabit.icon} (${bestCount} из 7 дней). ${bestHabit.streak >= 7 ? "Стрик впечатляет!" : "Вы на верном пути."}`
      );
    }
  }

  if (avgEnergy) {
    const energyNum = parseFloat(avgEnergy);
    if (energyNum >= 4) {
      paragraphs.push(
        `Средняя энергия за неделю — ${avgEnergy}/5. Похоже, вы в хорошей форме! ${topMood ? `Чаще всего вы чувствовали: ${topMood}.` : ""}`
      );
    } else if (energyNum >= 2.5) {
      paragraphs.push(
        `Ваша энергия на уровне ${avgEnergy}/5. ${topMood ? `Преобладающее настроение — ${topMood}.` : ""} Прислушивайтесь к себе — это тоже забота.`
      );
    } else {
      paragraphs.push(
        `Энергия была на уровне ${avgEnergy}/5 — это непростая неделя. ${topMood ? `Настроение чаще всего — ${topMood}.` : ""} Будьте мягче к себе, вы заслуживаете отдыха.`
      );
    }
  }

  if (weekIntentions.length > 0 || weekCheckins.length > 0) {
    const parts: string[] = [];
    if (weekIntentions.length > 0) parts.push(`${weekIntentions.length} утренних намерений`);
    if (weekCheckins.length > 0) parts.push(`${weekCheckins.length} вечерних рефлексий`);
    if (weekJournals.length > 0) parts.push(`${weekJournals.length} записей в дневнике`);
    paragraphs.push(
      `Вы уделили время осознанности: ${parts.join(", ")}. Каждый такой момент — инвестиция в себя.`
    );
  }

  if (completedTasks > 0) {
    paragraphs.push(
      `Завершено ${completedTasks} ${completedTasks === 1 ? "задача" : completedTasks < 5 ? "задачи" : "задач"}. Не забывайте ценить свои ежедневные победы — даже те, что кажутся мелкими.`
    );
  }

  // Greeting
  const greetings = [
    `Здравствуйте, ${props.profileName}`,
    `${props.profileName}, это ваше еженедельное письмо`,
    `Привет, ${props.profileName}`,
  ];
  const greeting = greetings[new Date().getDay() % greetings.length];

  // Closing
  const closings = [
    "Вы делаете больше, чем кажется. До следующей недели.",
    "Помните: путь важнее результата. Берегите себя.",
    "Каждая неделя — это новая глава. Ваша история прекрасна.",
    "Будьте добры к себе. Вы заслуживаете этого.",
  ];
  const closing = closings[Math.floor(new Date().getDate() / 7) % closings.length];

  return { greeting, paragraphs, closing };
}

export function WeeklyLetterCard(props: WeeklyLetterProps) {
  const th = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const week = getWeekRange();
  const letter = useMemo(() => generateLetter(props), [
    props.tasks, props.habits, props.moods, props.journalEntries,
    props.eveningCheckins, props.dailyIntentions, props.profileName,
  ]);

  return (
    <>
      {/* Teaser card */}
      <motion.button
        className="w-full rounded-2xl p-4 border flex items-center gap-3 text-left"
        style={{
          background: `linear-gradient(135deg, ${th.lavender}08, ${th.dustyBlue}08)`,
          borderColor: th.lavender + "25",
        }}
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${th.lavender}20, ${th.dustyBlue}20)` }}
        >
          <Mail className="w-5 h-5" style={{ color: th.lavender }} />
        </div>
        <div className="flex-1 min-w-0">
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: th.text }}>
            Письмо недели
          </span>
          <p style={{ fontSize: "0.7rem", color: th.textMuted }}>
            {week.startLabel} — {week.endLabel} · Нажмите, чтобы прочитать
          </p>
        </div>
        <ChevronRight className="w-5 h-5 shrink-0" style={{ color: th.textFaint }} />
      </motion.button>

      {/* Full letter modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: th.overlay }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="w-full max-w-[380px] max-h-[80vh] overflow-y-auto rounded-3xl p-6 shadow-xl"
              style={{ backgroundColor: th.bg }}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" style={{ color: th.lavender }} />
                  <span style={{ fontSize: "0.75rem", color: th.textMuted }}>
                    {week.startLabel} — {week.endLabel}
                  </span>
                </div>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: th.border }}
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" style={{ color: th.textMuted }} />
                </button>
              </div>

              {/* Letter content */}
              <div>
                <motion.h2
                  style={{ fontSize: "1.2rem", fontWeight: 700, color: th.text, marginBottom: 16 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {letter.greeting} 💌
                </motion.h2>

                {letter.paragraphs.map((p, i) => (
                  <motion.p
                    key={i}
                    style={{
                      fontSize: "0.82rem",
                      color: th.textSecondary,
                      lineHeight: 1.6,
                      marginBottom: 14,
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                  >
                    {p}
                  </motion.p>
                ))}

                {/* Divider */}
                <motion.div
                  className="my-5 flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex-1 h-px" style={{ backgroundColor: th.border }} />
                  <span style={{ fontSize: "0.9rem" }}>🌿</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: th.border }} />
                </motion.div>

                <motion.p
                  style={{
                    fontSize: "0.82rem",
                    color: th.sage,
                    fontStyle: "italic",
                    lineHeight: 1.5,
                    textAlign: "center",
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {letter.closing}
                </motion.p>

                <motion.p
                  style={{
                    fontSize: "0.72rem",
                    color: th.textFaint,
                    textAlign: "center",
                    marginTop: 16,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  С теплом, ваше приложение 🌱
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
