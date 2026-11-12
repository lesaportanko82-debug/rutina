import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wind } from "lucide-react";
import { useTheme } from "./theme";
import { InkLeaf } from "./ink-leaf";

type BreathPattern = {
  name: string;
  label: string;
  description: string;
  phases: { label: string; duration: number; scale: number }[];
};

const patterns: BreathPattern[] = [
  {
    name: "box",
    label: "Box Breathing",
    description: "4-4-4-4 — равномерное дыхание для спокойствия",
    phases: [
      { label: "Вдох", duration: 4, scale: 1 },
      { label: "Задержка", duration: 4, scale: 1 },
      { label: "Выдох", duration: 4, scale: 0.4 },
      { label: "Задержка", duration: 4, scale: 0.4 },
    ],
  },
  {
    name: "478",
    label: "4-7-8",
    description: "Техника глубокого расслабления",
    phases: [
      { label: "Вдох", duration: 4, scale: 1 },
      { label: "Задержка", duration: 7, scale: 1 },
      { label: "Выдох", duration: 8, scale: 0.4 },
    ],
  },
  {
    name: "calm",
    label: "Спокойное дыхание",
    description: "Простой ритм 4-6 для ежедневной практики",
    phases: [
      { label: "Вдох", duration: 4, scale: 1 },
      { label: "Выдох", duration: 6, scale: 0.4 },
    ],
  },
];

export function BreathingWidget() {
  const th = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<BreathPattern>(patterns[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [showPicker, setShowPicker] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Allow external components to open this widget
  useEffect(() => {
    const handler = () => setIsOpen(true);
    document.addEventListener("open-breathing", handler);
    return () => document.removeEventListener("open-breathing", handler);
  }, []);

  const currentPhase = selectedPattern.phases[phaseIndex];

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setTimer(currentPhase.duration);

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setPhaseIndex((pi) => {
            const next = (pi + 1) % selectedPattern.phases.length;
            if (next === 0) setCycles((c) => c + 1);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phaseIndex, selectedPattern]);

  const startSession = () => {
    setShowPicker(false);
    setPhaseIndex(0);
    setCycles(0);
    setIsRunning(true);
  };

  const stopSession = () => {
    setIsRunning(false);
    setPhaseIndex(0);
    setTimer(0);
    setCycles(0);
    setShowPicker(true);
  };

  const close = () => {
    stopSession();
    setIsOpen(false);
  };

  // На тёмном поле цвета фаз должны быть светлыми, иначе текст тонет
  const phaseColor =
    currentPhase?.label === "Вдох"
      ? "#8DB596"
      : currentPhase?.label === "Выдох"
        ? "#7EA8BE"
        : "#9B8EC4";

  return (
    <>
      {/* Full-screen overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            // Единственное тёмное поле приложения. Инверсия здесь оправдана:
            // это момент фокуса, и она даёт палитре глубину, которой
            // не хватало светлым экранам.
            style={{ background: th.field }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close */}
            <motion.button
              className="absolute top-12 right-5 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              onClick={close}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" style={{ color: th.onField }} />
            </motion.button>

            {showPicker ? (
              /* Pattern picker */
              <motion.div
                className="px-8 w-full max-w-[380px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "#7EA8BE30" }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Wind className="w-7 h-7" style={{ color: th.textSecondary }} />
                  </motion.div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: th.onField, marginBottom: 4 }}>
                    Дыхательная практика
                  </h2>
                  <p style={{ fontSize: "0.78rem", color: th.onField, opacity: 0.6, lineHeight: 1.4 }}>
                    Сделайте паузу. Несколько минут осознанного дыхания помогут вернуть спокойствие
                  </p>
                </div>

                <div className="space-y-3">
                  {patterns.map((p) => (
                    <motion.button
                      key={p.name}
                      className="w-full rounded-xl p-4 border text-left"
                      style={{
                        backgroundColor: selectedPattern.name === p.name ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                        borderColor: selectedPattern.name === p.name ? "rgba(255,255,255,0.3)" : "transparent",
                      }}
                      onClick={() => setSelectedPattern(p)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: th.onField }}>{p.label}</span>
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor: selectedPattern.name === p.name ? "#8DB596" : th.border,
                            backgroundColor: selectedPattern.name === p.name ? "#8DB596" : "transparent",
                          }}
                        >
                          {selectedPattern.name === p.name && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: "0.72rem", color: th.onField, opacity: 0.55 }}>{p.description}</p>
                      <div className="flex gap-1.5 mt-2">
                        {p.phases.map((ph, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full"
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 500,
                              backgroundColor: th.bgSecondary,
                              color: th.onField,
                            }}
                          >
                            {ph.label} {ph.duration}s
                          </span>
                        ))}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  className="w-full rounded-xl py-4 mt-6 shadow-sm"
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    background: "#7EA8BE",
                    boxShadow: "none", color: th.onInk}}
                  onClick={startSession}
                  whileTap={{ scale: 0.98 }}
                >
                  Начать
                </motion.button>
              </motion.div>
            ) : (
              /* Breathing animation */
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Cycle counter */}
                <div className="absolute top-14 left-0 right-0 text-center">
                  <span style={{ fontSize: "0.75rem", color: th.onField, opacity: 0.6 }}>
                    {selectedPattern.label} — цикл {cycles + 1}
                  </span>
                </div>

                {/* Листик дышит вместе с вами */}
                <div className="relative flex items-center justify-center" style={{ width: 256, height: 236 }}>
                  {/* одно тихое кольцо вместо стопки свечений: показывает фазу */}
                  <motion.div
                    className="absolute rounded-full"
                    style={{ border: `1.5px solid ${phaseColor}40` }}
                    animate={{
                      width: isRunning ? `${currentPhase.scale * 55 + 45}%` : "72%",
                      height: isRunning ? `${currentPhase.scale * 55 + 45}%` : "72%",
                    }}
                    transition={{ duration: isRunning ? currentPhase.duration : 0.6, ease: "easeInOut" }}
                  />
                  <InkLeaf
                    mood="day"
                    size={132}
                    draw={false}
                    color={th.onField}
                    breathDuration={currentPhase.duration}
                    breath={
                      !isRunning
                        ? "rest"
                        : currentPhase.label === "Вдох"
                          ? "inhale"
                          : currentPhase.label === "Выдох"
                            ? "exhale"
                            : "hold"
                    }
                  />
                </div>

                {/* Phase label */}
                <motion.div
                  className="mt-8 text-center"
                  key={phaseIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: phaseColor }}>
                    {currentPhase.label}
                  </h3>
                  <motion.span
                    key={timer}
                    className="display-num" style={{ fontSize: "2.6rem", color: th.onField, opacity: 0.75 }}
                    initial={{ opacity: 0.5, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {timer}
                  </motion.span>
                </motion.div>

                {/* Phase dots */}
                <div className="flex gap-2 mt-6">
                  {selectedPattern.phases.map((_, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: i === phaseIndex ? th.onField : "rgba(255,255,255,0.22)",
                        transform: i === phaseIndex ? "scale(1.3)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>

                {/* Stop button */}
                <motion.button
                  className="mt-10 px-8 py-3 rounded-xl border"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    borderColor: "rgba(255,255,255,0.28)",
                    color: th.onField,
                    backgroundColor: "transparent",
                  }}
                  onClick={stopSession}
                  whileTap={{ scale: 0.95 }}
                >
                  Завершить
                </motion.button>

                {/* Encouragement after 3 cycles */}
                <AnimatePresence>
                  {cycles >= 3 && (
                    <motion.p
                      className="mt-4"
                      style={{ fontSize: "0.78rem", color: th.accent, fontStyle: "italic" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Вы молодец. Чувствуете, как спокойствие возвращается?
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}