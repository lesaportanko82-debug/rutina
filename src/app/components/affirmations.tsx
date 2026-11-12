import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Sparkles } from "lucide-react";
import { useTheme } from "./theme";

interface AffirmationProps {
  energy: number | null; // 1-5, or null if no mood today
  anxietyLevel: number | null; // 1-10, latest
  mood: string | null;
}

// Affirmations grouped by context
const affirmationSets: Record<string, string[]> = {
  lowEnergy: [
    "Сегодня можно просто быть. Этого достаточно.",
    "Усталость — не слабость. Это сигнал заботы о себе.",
    "Вы делали всё, что могли. Отдых — тоже действие.",
    "Мягкость к себе — это суперсила.",
    "Даже тихий день имеет значение.",
    "Каждый выдох — маленький акт отпускания.",
  ],
  midEnergy: [
    "Вы на верном пути. Шаг за шагом.",
    "Сегодня — хороший день для маленькой победы.",
    "Ваши усилия накапливаются, даже когда вы этого не видите.",
    "Доверьтесь своему ритму — он мудрее, чем кажется.",
    "Каждое осознанное действие — это инвестиция в себя.",
    "Прогресс не всегда линейный, и это нормально.",
  ],
  highEnergy: [
    "Ваша энергия сегодня — подарок. Используйте её с радостью!",
    "Вы сияете. Поделитесь этим светом.",
    "Отличный момент, чтобы сделать что-то для будущего себя.",
    "Эта энергия — результат вашей заботы о себе.",
    "Вы можете больше, чем думаете. Но только если хотите.",
    "Позвольте себе радоваться без причины.",
  ],
  anxious: [
    "Тревога — это волна. Она придёт и уйдёт. Вы — берег.",
    "Прямо сейчас вы в безопасности. Дышите.",
    "Ваши чувства валидны. Тревога не определяет вас.",
    "Одна минута дыхания может изменить следующий час.",
    "Вы уже переживали трудное — и справлялись.",
    "Мягко. Медленно. Вы не одни в этом.",
  ],
  calm: [
    "Спокойствие — это ваша природа. Возвращайтесь к ней.",
    "В тишине рождаются лучшие решения.",
    "Вы создали это спокойствие. Цените его.",
    "Момент покоя — это момент силы.",
    "Позвольте этому спокойствию расти.",
  ],
  sad: [
    "Грусть — это глубина. Она делает радость ярче.",
    "Быть грустным — не значит быть сломанным.",
    "Иногда самое смелое — просто позволить себе чувствовать.",
    "Этот день пройдёт. Завтра будет другим.",
    "Нежность к себе — лучшее лекарство.",
  ],
  neutral: [
    "Сегодня — чистый лист. Наполните его тем, что важно.",
    "Просто быть — уже значит многое.",
    "Каждый новый день — это возможность.",
    "Ваше присутствие здесь — уже победа.",
    "Заметьте одну хорошую вещь сегодня.",
    "Дышите глубоко. Всё в порядке.",
  ],
};

function pickAffirmation(energy: number | null, anxietyLevel: number | null, mood: string | null, seed: number): string {
  let category = "neutral";

  // Anxiety takes priority when high
  if (anxietyLevel !== null && anxietyLevel >= 6) {
    category = "anxious";
  } else if (mood === "Грусть") {
    category = "sad";
  } else if (mood === "Спокойствие") {
    category = "calm";
  } else if (energy !== null) {
    if (energy <= 2) category = "lowEnergy";
    else if (energy <= 3) category = "midEnergy";
    else category = "highEnergy";
  }

  const set = affirmationSets[category];
  return set[seed % set.length];
}

export function AffirmationCard({ energy, anxietyLevel, mood }: AffirmationProps) {
  const th = useTheme();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100));

  const affirmation = useMemo(
    () => pickAffirmation(energy, anxietyLevel, mood, seed),
    [energy, anxietyLevel, mood, seed]
  );

  // Pick accent color based on context
  const accentColor = useMemo(() => {
    if (anxietyLevel !== null && anxietyLevel >= 6) return th.dustyBlue;
    if (mood === "Грусть") return th.lavender;
    if (mood === "Спокойствие") return th.teal;
    if (energy !== null && energy <= 2) return th.warm;
    if (energy !== null && energy >= 4) return th.sage;
    return th.gold;
  }, [energy, anxietyLevel, mood, th]);

  return (
    <motion.div
      className="rounded-2xl p-4 border relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accentColor}06, ${accentColor}03)`,
        borderColor: accentColor + "18",
      }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Decorative sparkle */}
      <motion.div
        className="absolute -top-2 -right-2 w-20 h-20 rounded-full"
        style={{ backgroundColor: accentColor + "06" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />

      <div className="flex items-start gap-3 relative z-10">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: accentColor + "15" }}
        >
          <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: accentColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Аффирмация дня
          </span>
          <AnimatePresence mode="wait">
            <motion.p
              key={seed}
              style={{
                fontSize: "0.85rem",
                fontWeight: 500,
                color: th.text,
                lineHeight: 1.5,
                marginTop: 4,
                fontStyle: "italic",
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              {affirmation}
            </motion.p>
          </AnimatePresence>
        </div>
        <motion.button
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: th.border + "60" }}
          onClick={() => setSeed((s) => s + 1)}
          whileTap={{ scale: 0.85, rotate: 180 }}
        >
          <RefreshCw className="w-3 h-3" style={{ color: th.textFaint }} />
        </motion.button>
      </div>
    </motion.div>
  );
}
