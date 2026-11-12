import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, X } from "lucide-react";
import { useTheme } from "./theme";
import type { Habit, MoodEntry } from "./use-app-store";

const today = () => new Date().toISOString().split("T")[0];

// ─── Message pools ───

const returnMessages = [
  { text: "Вы вернулись — это уже смелый шаг", emoji: "💛" },
  { text: "Паузы — это не провал, это часть пути", emoji: "🌿" },
  { text: "Каждый новый день — это новый шанс", emoji: "🌅" },
  { text: "Рады видеть вас снова. Вы важны", emoji: "🤗" },
  { text: "Перерыв не отменяет вашего прогресса", emoji: "🌱" },
  { text: "Иногда отступить — значит набраться сил", emoji: "🦋" },
];

const streakLossMessages = [
  { text: "Стрик — это не главное. Главное — вы здесь", emoji: "💜" },
  { text: "Один пропущенный день не определяет вас", emoji: "🌸" },
  { text: "Прощайте себя так, как простили бы друга", emoji: "🌷" },
  { text: "Вы не начинаете с нуля — весь ваш опыт с вами", emoji: "✨" },
];

const lowEnergyMessages = [
  { text: "Бережно к себе. Сегодня можно меньше", emoji: "🫂" },
  { text: "Даже маленький шаг сегодня — это достаточно", emoji: "🕊️" },
  { text: "Прислушайтесь к себе. Отдых — тоже забота", emoji: "☁️" },
];

const consistentMessages = [
  { text: "Вы невероятно последовательны. Это вдохновляет", emoji: "🌟" },
  { text: "Стабильность — это суперсила. Вы это доказываете", emoji: "💫" },
  { text: "Ваша регулярность создаёт настоящие перемены", emoji: "🌻" },
];

const gentleStartMessages = [
  { text: "Не нужно быть идеальным. Просто будьте собой", emoji: "🌱" },
  { text: "Начните с одной маленькой вещи. Этого достаточно", emoji: "🪴" },
  { text: "Вы уже здесь. Это самое важное", emoji: "🌿" },
];

export type CompassionateMessage = {
  text: string;
  emoji: string;
  type: "return" | "streak-loss" | "low-energy" | "consistent" | "gentle-start";
  priority: number;
};

export function getCompassionateMessage(
  habits: Habit[],
  moods: MoodEntry[],
): CompassionateMessage | null {
  const d = today();
  const messages: CompassionateMessage[] = [];

  // Check if user returned after absence
  if (habits.length > 0) {
    const allCompletedDates = habits.flatMap((h) => h.completedDates).sort();
    if (allCompletedDates.length > 0) {
      const lastActivity = allCompletedDates[allCompletedDates.length - 1];
      const daysSince = Math.floor(
        (new Date(d).getTime() - new Date(lastActivity).getTime()) / 86400000
      );
      if (daysSince >= 3) {
        const msg = returnMessages[Math.floor(Math.random() * returnMessages.length)];
        messages.push({ ...msg, type: "return", priority: 3 });
      }
    }
  }

  // Check for recent streak losses (habits with streak=0 but had bestStreak > 3)
  const lostStreaks = habits.filter((h) => h.streak === 0 && h.bestStreak >= 3);
  if (lostStreaks.length > 0) {
    const msg = streakLossMessages[Math.floor(Math.random() * streakLossMessages.length)];
    messages.push({ ...msg, type: "streak-loss", priority: 2 });
  }

  // Check recent mood energy levels
  const recentMoods = moods
    .filter((m) => {
      const diff = Math.floor(
        (new Date(d).getTime() - new Date(m.date).getTime()) / 86400000
      );
      return diff >= 0 && diff <= 2;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (recentMoods.length > 0) {
    const avgEnergy = recentMoods.reduce((s, m) => s + m.energy, 0) / recentMoods.length;
    if (avgEnergy <= 2) {
      const msg = lowEnergyMessages[Math.floor(Math.random() * lowEnergyMessages.length)];
      messages.push({ ...msg, type: "low-energy", priority: 2.5 });
    }
  }

  // Check if user is doing well (all habits done today or high streaks)
  const doneToday = habits.filter((h) => h.completedDates.includes(d)).length;
  const highStreaks = habits.filter((h) => h.streak >= 7).length;
  if (doneToday >= habits.length * 0.8 && habits.length > 0 || highStreaks >= 3) {
    const msg = consistentMessages[Math.floor(Math.random() * consistentMessages.length)];
    messages.push({ ...msg, type: "consistent", priority: 1 });
  }

  // If no habits completed at all yet — gentle start
  const totalCompleted = habits.reduce((s, h) => s + h.completedDates.length, 0);
  if (totalCompleted === 0 && habits.length > 0) {
    const msg = gentleStartMessages[Math.floor(Math.random() * gentleStartMessages.length)];
    messages.push({ ...msg, type: "gentle-start", priority: 1.5 });
  }

  if (messages.length === 0) return null;

  // Return highest priority message
  messages.sort((a, b) => b.priority - a.priority);
  return messages[0];
}

interface CompassionateCardProps {
  habits: Habit[];
  moods: MoodEntry[];
  dismissKey: string;
  dismissed: boolean;
  onDismiss: () => void;
}

export function CompassionateCard({ habits, moods, dismissKey, dismissed, onDismiss }: CompassionateCardProps) {
  const th = useTheme();

  const message = useMemo(() => getCompassionateMessage(habits, moods), [habits, moods]);

  if (!message || dismissed) return null;

  const bgMap: Record<string, string> = {
    "return": th.lavender + "12",
    "streak-loss": th.rose + "12",
    "low-energy": th.dustyBlue + "12",
    "consistent": th.sage + "12",
    "gentle-start": th.gold + "12",
  };

  const borderMap: Record<string, string> = {
    "return": th.lavender + "30",
    "streak-loss": th.rose + "30",
    "low-energy": th.dustyBlue + "30",
    "consistent": th.sage + "30",
    "gentle-start": th.gold + "30",
  };

  const accentMap: Record<string, string> = {
    "return": th.lavender,
    "streak-loss": th.rose,
    "low-energy": th.dustyBlue,
    "consistent": th.sage,
    "gentle-start": th.gold,
  };

  return (
    <AnimatePresence>
      <motion.div
        className="rounded-2xl p-4 border relative overflow-hidden"
        style={{
          backgroundColor: bgMap[message.type],
          borderColor: borderMap[message.type],
        }}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Subtle decorative circle */}
        <div
          className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.06]"
          style={{ backgroundColor: accentMap[message.type] }}
        />

        <button
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: th.border + "60" }}
          onClick={onDismiss}
        >
          <X className="w-3 h-3" style={{ color: th.textMuted }} />
        </button>

        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: accentMap[message.type] + "20" }}
          >
            <Heart className="w-4.5 h-4.5" style={{ color: accentMap[message.type] }} />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <p style={{ fontSize: "0.85rem", fontWeight: 500, color: th.text, lineHeight: 1.4 }}>
              <span style={{ marginRight: 6 }}>{message.emoji}</span>
              {message.text}
            </p>
            <p style={{ fontSize: "0.68rem", color: th.textMuted, marginTop: 4 }}>
              {message.type === "return" && "Каждое возвращение делает вас сильнее"}
              {message.type === "streak-loss" && "Стрики вернутся. Вы уже знаете как"}
              {message.type === "low-energy" && "Забота о себе — тоже продуктивность"}
              {message.type === "consistent" && "Продолжайте в своём темпе"}
              {message.type === "gentle-start" && "Попробуйте отметить хотя бы одну привычку"}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
