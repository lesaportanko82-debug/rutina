import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../theme";
import { ArrowLeft, Check, ChevronRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";
import { useApp } from "../app-context";
import { AppIcon } from "../app-icon";

interface GroundingStep {
  count: number;
  sense: string;
  emoji: string;
  prompt: string;
  color: string;
  examples: string[];
}

const steps: GroundingStep[] = [
  {
    count: 5,
    sense: "Зрение",
    emoji: "👁️",
    prompt: "Назовите 5 вещей, которые вы видите",
    color: "#8DB596",
    examples: ["Окно", "Лампа", "Руки", "Дерево", "Стена"],
  },
  {
    count: 4,
    sense: "Слух",
    emoji: "👂",
    prompt: "Назовите 4 звука, которые слышите",
    color: "#7EA8BE",
    examples: ["Тиканье", "Ветер", "Дыхание", "Шаги"],
  },
  {
    count: 3,
    sense: "Осязание",
    emoji: "✋",
    prompt: "Назовите 3 вещи, которые ощущаете",
    color: "#9B8EC4",
    examples: ["Ткань одежды", "Тёплый воздух", "Кресло"],
  },
  {
    count: 2,
    sense: "Обоняние",
    emoji: "👃",
    prompt: "Назовите 2 запаха",
    color: "#C4A86C",
    examples: ["Кофе", "Свежий воздух"],
  },
  {
    count: 1,
    sense: "Вкус",
    emoji: "👅",
    prompt: "Назовите 1 вкус",
    color: "#C4876C",
    examples: ["Вода"],
  },
];

export function GroundingPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const { darkMode } = useApp();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(steps.map((s) => Array(s.count).fill("")));
  const [isFinished, setIsFinished] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filledCount, setFilledCount] = useState(0);

  const currentStep = steps[currentStepIdx];
  const currentAnswers = answers[currentStepIdx];
  const stepFilled = currentAnswers.filter((a) => a.trim()).length;

  const addAnswer = useCallback(() => {
    if (!inputValue.trim()) return;
    const newAnswers = [...answers];
    const stepAnswers = [...newAnswers[currentStepIdx]];
    const emptyIdx = stepAnswers.findIndex((a) => !a.trim());
    if (emptyIdx >= 0) {
      stepAnswers[emptyIdx] = inputValue.trim();
      newAnswers[currentStepIdx] = stepAnswers;
      setAnswers(newAnswers);
      setFilledCount((c) => c + 1);
    }
    setInputValue("");
  }, [inputValue, answers, currentStepIdx]);

  const useExample = useCallback((example: string) => {
    const newAnswers = [...answers];
    const stepAnswers = [...newAnswers[currentStepIdx]];
    const emptyIdx = stepAnswers.findIndex((a) => !a.trim());
    if (emptyIdx >= 0) {
      stepAnswers[emptyIdx] = example;
      newAnswers[currentStepIdx] = stepAnswers;
      setAnswers(newAnswers);
      setFilledCount((c) => c + 1);
    }
  }, [answers, currentStepIdx]);

  const goNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((i) => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  const reset = () => {
    setCurrentStepIdx(0);
    setAnswers(steps.map((s) => Array(s.count).fill("")));
    setIsFinished(false);
    setFilledCount(0);
    setInputValue("");
  };

  const totalItems = steps.reduce((s, step) => s + step.count, 0);
  const progress = (filledCount / totalItems) * 100;

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: t.border }}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4.5 h-4.5" style={{ color: t.textSecondary }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: t.text }}>
            Заземление 5-4-3-2-1
          </h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>
            Техника для возвращения в момент «здесь и сейчас»
          </p>
        </div>
      </motion.div>

      {/* Progress */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-full rounded-full h-2" style={{ backgroundColor: t.border }}>
          <motion.div
            className="h-2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${currentStep.color}, ${steps[Math.min(currentStepIdx + 1, 4)].color})` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-0.5"
              style={{ opacity: i <= currentStepIdx ? 1 : 0.3 }}
            >
              <span style={{ fontSize: "0.8rem" }}><AppIcon icon={s.emoji} size={14} color={i === currentStepIdx ? s.color : undefined} /></span>
              <span style={{ fontSize: "0.55rem", fontWeight: 500, color: i === currentStepIdx ? s.color : t.textFaint }}>
                {s.count}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Finished state */}
      <AnimatePresence mode="wait">
        {isFinished ? (
          <motion.div
            key="finished"
            className="text-center py-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${t.sage}20, ${t.teal}20)` }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <span style={{ fontSize: "2rem" }}>🌿</span>
            </motion.div>

            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text, marginBottom: 8 }}>
              Вы здесь
            </h2>
            <p style={{ fontSize: "0.85rem", color: t.textMuted, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
              Вы вернулись в настоящий момент. Ваше тело — в безопасности. Дышите мягко.
            </p>

            <motion.div
              className="mt-8 p-4 rounded-2xl"
              style={{ backgroundColor: t.bgSecondary }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p style={{ fontSize: "0.75rem", color: t.textSecondary, fontStyle: "italic", lineHeight: 1.5 }}>
                «Тревога — это волна. Она приходит и уходит. Вы — берег, который остаётся.»
              </p>
            </motion.div>

            <div className="flex gap-3 mt-8">
              <button
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                style={{ backgroundColor: t.border, fontSize: "0.82rem", fontWeight: 500, color: t.text }}
                onClick={reset}
              >
                <RotateCcw className="w-4 h-4" />
                Ещё раз
              </button>
              <button
                className="flex-1 py-3 rounded-xl text-white flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${t.sage}, ${t.teal})`, fontSize: "0.82rem", fontWeight: 600 }}
                onClick={() => navigate(-1)}
              >
                Готово
                <Check className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* Active step */
          <motion.div
            key={`step-${currentStepIdx}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step card */}
            <GlassPanel darkMode={darkMode} color={currentStep.color} className="rounded-2xl mb-5">
            <div
              className="p-5 text-center"
            >
              <motion.span
                style={{ fontSize: "2.5rem", display: "block", marginBottom: 8 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              >
                <AppIcon icon={currentStep.emoji} size={40} color={currentStep.color} />
              </motion.span>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginBottom: 4 }}>
                {currentStep.prompt}
              </h2>
              <p style={{ fontSize: "0.72rem", color: t.textMuted }}>
                {currentStep.sense} · {stepFilled}/{currentStep.count}
              </p>
            </div>
            </GlassPanel>

            {/* Answer slots */}
            <div className="space-y-2 mb-4">
              {currentAnswers.map((answer, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl px-4 py-3 border flex items-center gap-3"
                  style={{
                    backgroundColor: answer ? currentStep.color + "08" : t.bgSecondary,
                    borderColor: answer ? currentStep.color + "25" : t.border,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{
                      backgroundColor: answer ? currentStep.color : t.border,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                    }}
                  >
                    {answer ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span style={{
                    fontSize: "0.82rem",
                    fontWeight: answer ? 500 : 400,
                    color: answer ? t.text : t.textFaint,
                    fontStyle: answer ? "normal" : "italic",
                  }}>
                    {answer || "..."}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Input or next button */}
            {stepFilled < currentStep.count ? (
              <>
                {/* Example suggestions */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {currentStep.examples
                    .filter((ex) => !currentAnswers.includes(ex))
                    .map((ex) => (
                      <button
                        key={ex}
                        className="px-2.5 py-1 rounded-full border"
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 500,
                          borderColor: t.border,
                          color: t.textMuted,
                        }}
                        onClick={() => useExample(ex)}
                      >
                        {ex}
                      </button>
                    ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`${currentStep.sense}...`}
                    className="flex-1 rounded-xl px-3 py-3 border outline-none"
                    style={{ fontSize: "0.82rem", backgroundColor: t.inputBg, borderColor: t.border, color: t.text }}
                    onKeyDown={(e) => e.key === "Enter" && addAnswer()}
                    autoFocus
                  />
                  <motion.button
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: inputValue.trim() ? currentStep.color : t.border }}
                    onClick={addAnswer}
                    whileTap={{ scale: 0.9 }}
                    disabled={!inputValue.trim()}
                  >
                    <Check className="w-4.5 h-4.5 text-white" />
                  </motion.button>
                </div>
              </>
            ) : (
              <motion.button
                className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${currentStep.color}, ${steps[Math.min(currentStepIdx + 1, 4)].color})`,
                  fontSize: "0.88rem",
                  fontWeight: 600,
                }}
                onClick={goNext}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {currentStepIdx < steps.length - 1 ? "Далее" : "Завершить"}
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}

            {/* Skip button */}
            {stepFilled < currentStep.count && (
              <button
                className="w-full mt-3 py-2 text-center"
                style={{ fontSize: "0.72rem", color: t.textFaint }}
                onClick={goNext}
              >
                Пропустить →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}