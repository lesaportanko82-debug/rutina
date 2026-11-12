import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wind } from "lucide-react";
import { useTheme } from "./theme";

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
            style={{
              background: `linear-gradient(180deg, ${th.bg}F0, ${th.bgSecondary}F8)`,
              backdropFilter: "blur(20px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close */}
            <motion.button
              className="absolute top-12 right-5 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: th.border }}
              onClick={close}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" style={{ color: th.textSecondary }} />
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
                    style={{ background: "linear-gradient(135deg, #7EA8BE30, #9B8EC430)" }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Wind className="w-7 h-7" style={{ color: th.dustyBlue }} />
                  </motion.div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: th.text, marginBottom: 4 }}>
                    Дыхательная практика
                  </h2>
                  <p style={{ fontSize: "0.78rem", color: th.textMuted, lineHeight: 1.4 }}>
                    Сделайте паузу. Несколько минут осознанного дыхания помогут вернуть спокойствие
                  </p>
                </div>

                <div className="space-y-3">
                  {patterns.map((p) => (
                    <motion.button
                      key={p.name}
                      className="w-full rounded-2xl p-4 border text-left"
                      style={{
                        backgroundColor: selectedPattern.name === p.name ? phaseColor + "12" : th.card,
                        borderColor: selectedPattern.name === p.name ? phaseColor + "40" : th.border,
                      }}
                      onClick={() => setSelectedPattern(p)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: th.text }}>{p.label}</span>
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
                      <p style={{ fontSize: "0.72rem", color: th.textMuted }}>{p.description}</p>
                      <div className="flex gap-1.5 mt-2">
                        {p.phases.map((ph, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full"
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 500,
                              backgroundColor: th.bgSecondary,
                              color: th.textMuted,
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
                  className="w-full text-white rounded-2xl py-4 mt-6 shadow-md"
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #7EA8BE, #9B8EC4)",
                    boxShadow: "0 4px 20px rgba(126, 168, 190, 0.35)",
                  }}
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
                  <span style={{ fontSize: "0.75rem", color: th.textMuted }}>
                    {selectedPattern.label} — цикл {cycles + 1}
                  </span>
                </div>

                {/* Breathing circle */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {/* Outer glow rings */}
                  {[0, 1, 2].map((ring) => (
                    <motion.div
                      key={ring}
                      className="absolute rounded-full"
                      style={{
                        border: `1px solid ${phaseColor}${15 - ring * 4}`,
                      }}
                      animate={{
                        width: isRunning ? `${(currentPhase.scale * 100 + 60) + ring * 30}%` : "90%",
                        height: isRunning ? `${(currentPhase.scale * 100 + 60) + ring * 30}%` : "90%",
                        opacity: isRunning ? [0.3, 0.1] : 0.2,
                      }}
                      transition={{ duration: currentPhase.duration, ease: "easeInOut" }}
                    />
                  ))}

                  {/* Main circle */}
                  <motion.div
                    className="rounded-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle, ${phaseColor}30, ${phaseColor}15)`,
                      border: `2px solid ${phaseColor}50`,
                    }}
                    animate={{
                      width: isRunning ? `${currentPhase.scale * 85 + 15}%` : "50%",
                      height: isRunning ? `${currentPhase.scale * 85 + 15}%` : "50%",
                    }}
                    transition={{ duration: currentPhase.duration, ease: "easeInOut" }}
                  >
                    <motion.div
                      className="rounded-full"
                      style={{
                        width: "40%",
                        height: "40%",
                        background: `radial-gradient(circle, ${phaseColor}60, ${phaseColor}25)`,
                      }}
                      animate={{
                        scale: isRunning ? [0.9, 1.1, 0.9] : 1,
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
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
                    style={{ fontSize: "2.5rem", fontWeight: 300, color: th.textMuted }}
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
                        backgroundColor: i === phaseIndex ? phaseColor : th.border,
                        transform: i === phaseIndex ? "scale(1.3)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>

                {/* Stop button */}
                <motion.button
                  className="mt-10 px-8 py-3 rounded-2xl border"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    borderColor: th.border,
                    color: th.textMuted,
                    backgroundColor: th.card,
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
                      style={{ fontSize: "0.78rem", color: th.sage, fontStyle: "italic" }}
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