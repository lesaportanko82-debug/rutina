import { useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  position?: "top" | "bottom" | "center";
  highlight?: "top" | "bottom-nav" | "fab" | "none";
}

interface FeatureTourProps {
  steps: TourStep[];
  tourKey: string;
  seenTours: string[];
  onComplete: (tourKey: string) => void;
  delay?: number;
}

export function FeatureTour({ steps, tourKey, seenTours, onComplete, delay = 800 }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (seenTours.includes(tourKey)) return;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [tourKey, seenTours, delay]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setVisible(false);
      onComplete(tourKey);
    }
  }, [currentStep, steps.length, onComplete, tourKey]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    setVisible(false);
    onComplete(tourKey);
  }, [onComplete, tourKey]);

  if (!visible || seenTours.includes(tourKey)) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const positionClass =
    step.position === "top"
      ? "top-20"
      : step.position === "bottom"
      ? "bottom-24"
      : "top-1/2 -translate-y-1/2";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[150] pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={handleSkip}
        />

        {/* Highlight area for bottom nav */}
        {step.highlight === "bottom-nav" && (
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-16"
            style={{ backgroundColor: "transparent", boxShadow: "0 0 0 4000px rgba(0,0,0,0.45)" }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          className={`absolute left-1/2 -translate-x-1/2 ${positionClass} w-[calc(100%-48px)] max-w-[380px]`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          key={step.id}
        >
          <div
            className="rounded-2xl p-5 shadow-2xl relative"
            style={{ backgroundColor: "#FAF8F5" }}
          >
            {/* Close button */}
            <button
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#F0EDE8" }}
              onClick={handleSkip}
            >
              <X className="w-3.5 h-3.5" style={{ color: "#9B9489" }} />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3 mb-4 pr-6">
              <motion.div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#8DB59618" }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span style={{ fontSize: "1.4rem" }}>{step.emoji}</span>
              </motion.div>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#4A4540", marginBottom: 4 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#9B9489", lineHeight: 1.5 }}>
                  {step.description}
                </p>
              </div>
            </div>

            {/* Progress & controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all"
                    style={{
                      width: i === currentStep ? 16 : 6,
                      height: 6,
                      backgroundColor: i === currentStep ? "#8DB596" : "#E5E0D8",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#F0EDE8" }}
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="w-4 h-4" style={{ color: "#9B9489" }} />
                  </button>
                )}
                <motion.button
                  className="px-4 py-2 rounded-xl text-white flex items-center gap-1"
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #8DB596, #7BAFB0)",
                  }}
                  onClick={handleNext}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLast ? "Понятно!" : "Далее"}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
            </div>

            {/* Skip link */}
            {!isLast && (
              <button
                className="w-full mt-2 text-center"
                style={{ fontSize: "0.72rem", color: "#B5AFA6" }}
                onClick={handleSkip}
              >
                Пропустить все подсказки
              </button>
            )}
          </div>

          {/* Arrow pointer */}
          {step.position === "bottom" && (
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
              style={{ backgroundColor: "#FAF8F5" }}
            />
          )}
          {step.position === "top" && (
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
              style={{ backgroundColor: "#FAF8F5" }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Inline tip (non-blocking) ───

interface InlineTipProps {
  text: string;
  emoji?: string;
  tipKey: string;
  seenTips: string[];
  onDismiss: (tipKey: string) => void;
  color?: string;
}

export function InlineTip({ text, emoji = "💡", tipKey, seenTips, onDismiss, color = "#C4A86C" }: InlineTipProps) {
  if (seenTips.includes(tipKey)) return null;

  return (
    <motion.div
      className="rounded-xl p-3 mb-3 flex items-start gap-2.5 border"
      style={{ backgroundColor: color + "08", borderColor: color + "20" }}
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
    >
      <span style={{ fontSize: "0.9rem", marginTop: 1 }}>{emoji}</span>
      <p className="flex-1" style={{ fontSize: "0.75rem", color: "#6B665F", lineHeight: 1.5 }}>
        {text}
      </p>
      <button
        className="shrink-0 mt-0.5"
        onClick={() => onDismiss(tipKey)}
      >
        <X className="w-3.5 h-3.5" style={{ color: "#B5AFA6" }} />
      </button>
    </motion.div>
  );
}

// ─── Pulse highlight wrapper ───

interface PulseHighlightProps {
  children: ReactNode;
  active: boolean;
  color?: string;
}

export function PulseHighlight({ children, active, color = "#8DB596" }: PulseHighlightProps) {
  if (!active) return <>{children}</>;

  return (
    <div className="relative">
      <motion.div
        className="absolute -inset-1 rounded-2xl pointer-events-none"
        style={{ border: `2px solid ${color}40` }}
        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: 3 }}
      />
      {children}
    </div>
  );
}

// ─── Tour definitions ───

export const dashboardTour: TourStep[] = [
  {
    id: "dash-welcome",
    emoji: "🏠",
    title: "Это ваш дашборд",
    description: "Здесь только самое важное: привычки, задачи и одно мягкое действие. Никакой перегрузки.",
    position: "center",
  },
  {
    id: "dash-context",
    emoji: "🌅",
    title: "Контекстные подсказки",
    description: "Утром — намерение на день, вечером — рефлексия. Приложение подстраивается под ваш ритм.",
    position: "top",
  },
  {
    id: "dash-habits",
    emoji: "🔄",
    title: "Быстрые привычки",
    description: "Нажмите на привычку, чтобы отметить её. Просто и без лишнего.",
    position: "center",
  },
  {
    id: "dash-tools",
    emoji: "🧰",
    title: "Все инструменты",
    description: "Кнопка внизу открывает панель инструментов: дневник, дыхание, звуки, аналитика и многое другое. Добавьте любимые в избранное!",
    position: "bottom",
  },
  {
    id: "dash-nav",
    emoji: "🧭",
    title: "Навигация",
    description: "Внизу — 5 разделов: Главная, Задачи, Привычки, Настроение и Профиль.",
    position: "bottom",
    highlight: "bottom-nav",
  },
];

export const tasksTour: TourStep[] = [
  {
    id: "tasks-intro",
    emoji: "📋",
    title: "Доска задач",
    description: "Здесь все ваши дела. Нажмите + чтобы добавить задачу с категорией, приоритетом и повторением.",
    position: "top",
  },
  {
    id: "tasks-swipe",
    emoji: "👆",
    title: "Свайп-жесты",
    description: "Свайпните задачу вправо → чтобы выполнить, влево ← чтобы удалить. Быстро и удобно!",
    position: "center",
  },
  {
    id: "tasks-subtasks",
    emoji: "📎",
    title: "Подзадачи",
    description: "Нажмите стрелку ▼ на задаче, чтобы раскрыть подзадачи, изменить категорию или приоритет.",
    position: "center",
  },
];

export const habitsTour: TourStep[] = [
  {
    id: "habits-intro",
    emoji: "🌿",
    title: "Трекер привычек",
    description: "Нажмите на привычку, чтобы отметить. Стрик считает дни подряд — не прерывайте серию!",
    position: "top",
  },
  {
    id: "habits-catalog",
    emoji: "📚",
    title: "Каталог привычек",
    description: "Нажмите + чтобы выбрать из 32 готовых привычек или создать свою собственную.",
    position: "center",
  },
  {
    id: "habits-heatmap",
    emoji: "🗓️",
    title: "Тепловая карта",
    description: "Раскройте привычку и нажмите «Тепловая карта» — увидите свой прогресс за 30 дней.",
    position: "center",
  },
];

export const moodTour: TourStep[] = [
  {
    id: "mood-intro",
    emoji: "🎨",
    title: "Трекер настроения",
    description: "Выберите эмоцию на цветовом круге, укажите уровень энергии и оставьте заметку.",
    position: "top",
  },
  {
    id: "mood-calendar",
    emoji: "📅",
    title: "Календарь настроения",
    description: "Прокрутите вниз — увидите цветной календарь месяца и распределение ваших эмоций.",
    position: "center",
  },
];

export const profileTour: TourStep[] = [
  {
    id: "profile-intro",
    emoji: "👤",
    title: "Ваш профиль",
    description: "Здесь анкета, настройки, достижения и экспорт данных. Заполните анкету — получите персональные советы!",
    position: "top",
  },
  {
    id: "profile-achievements",
    emoji: "🏆",
    title: "Достижения",
    description: "Выполняйте задачи, привычки и стрики — открывайте достижения и получайте награды!",
    position: "center",
  },
];