import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../theme";
import { useApp } from "../app-context";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

interface PMRStep {
  muscle: string;
  icon: string;
  instruction: string;
  tenseDuration: number; // seconds
  relaxDuration: number;
}

const steps: PMRStep[] = [
  { muscle: "Руки (кулаки)", icon: "✊", instruction: "Сожмите кулаки как можно крепче. Чувствуйте напряжение в ладонях и предплечьях.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Руки (бицепсы)", icon: "💪", instruction: "Согните руки в локтях, напрягите бицепсы. Прижмите кулаки к плечам.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Плечи", icon: "🙆", instruction: "Поднимите плечи к ушам. Зажмите их так высоко, как можете.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Лоб", icon: "😤", instruction: "Поднимите брови как можно выше. Сморщите лоб.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Глаза", icon: "😑", instruction: "Крепко зажмурьтесь. Чувствуйте напряжение вокруг глаз.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Челюсть", icon: "😬", instruction: "Стисните зубы. Напрягите челюсть и скулы.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Шея", icon: "🦒", instruction: "Аккуратно прижмите подбородок к груди. Чувствуйте натяжение задней части шеи.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Грудь и спина", icon: "🫁", instruction: "Глубоко вдохните, задержите дыхание. Сведите лопатки.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Живот", icon: "🧘", instruction: "Напрягите мышцы пресса. Втяните живот максимально.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Бёдра", icon: "🦵", instruction: "Напрягите бёдра, вытяните ноги перед собой.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Голени", icon: "🦶", instruction: "Потяните носки на себя. Чувствуйте напряжение в голенях.", tenseDuration: 5, relaxDuration: 10 },
  { muscle: "Стопы", icon: "👣", instruction: "Подожмите пальцы ног, напрягите стопы.", tenseDuration: 5, relaxDuration: 10 },
];

type Phase = "idle" | "intro" | "tense" | "relax" | "transition" | "complete";

export function PMRPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const { addXP, darkMode } = useApp();
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[stepIdx];

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const start = useCallback(() => {
    setPhase("intro");
    setStepIdx(0);
    setTimer(5); // 5 sec intro
    setTotalTime(0);
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setPhase("idle");
    setStepIdx(0);
    setTimer(0);
  }, [cleanup]);

  // Timer logic
  useEffect(() => {
    if (phase === "idle" || phase === "complete") return;
    cleanup();
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Advance phase
          if (phase === "intro") {
            setPhase("tense");
            return steps[0].tenseDuration;
          }
          if (phase === "tense") {
            setPhase("relax");
            return steps[stepIdx].relaxDuration;
          }
          if (phase === "relax") {
            if (stepIdx >= steps.length - 1) {
              setPhase("complete");
              addXP(20);
              return 0;
            }
            setPhase("transition");
            return 3;
          }
          if (phase === "transition") {
            setStepIdx((s) => s + 1);
            setPhase("tense");
            return steps[stepIdx + 1]?.tenseDuration || 5;
          }
          return 0;
        }
        return prev - 1;
      });
      setTotalTime((prev) => prev + 1);
    }, 1000);
    return cleanup;
  }, [phase, stepIdx]);

  const phaseLabel = phase === "intro" ? "Приготовьтесь..." :
    phase === "tense" ? "НАПРЯГИТЕ" :
    phase === "relax" ? "Расслабьте..." :
    phase === "transition" ? "Переходим к следующей группе..." :
    phase === "complete" ? "Готово!" : "";

  const phaseColor = phase === "tense" ? "#C4876C" :
    phase === "relax" ? "#8DB596" :
    phase === "transition" ? "#9B8EC4" : "#7EA8BE";

  const progress = (stepIdx / steps.length) * 100 + (phase === "relax" || phase === "complete" ? (1 / steps.length) * 100 : 0);

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { reset(); navigate(-1); }} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text }}>Мышечная релаксация</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Прогрессивная техника Джейкобсона</p>
        </div>
      </div>

      {phase === "idle" ? (
        /* Start screen */
        <GlassPanel darkMode={darkMode} color="#8DB596" className="rounded-2xl">
        <motion.div className="p-6 text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span style={{ fontSize: "3rem" }}>🧘‍♀️</span>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 12 }}>
            Прогрессивная релаксация
          </h2>
          <p style={{ fontSize: "0.8rem", color: t.textMuted, marginTop: 8, lineHeight: 1.6 }}>
            12 групп мышц. Каждую группу вы напрягаете на 5 секунд, затем расслабляете на 10 секунд.
            Всего ~4 минуты.
          </p>

          <div className="mt-6 space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: t.bgSecondary }}>
                <span style={{ fontSize: "0.8rem" }}><AppIcon icon={s.icon} size={14} /></span>
                <span style={{ fontSize: "0.72rem", color: t.textMuted }}>{s.muscle}</span>
              </div>
            ))}
          </div>

          <motion.button
            className="mt-6 px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto"
            style={{ backgroundColor: t.sage, color: "#fff", fontSize: "0.9rem" }}
            whileTap={{ scale: 0.95 }}
            onClick={start}
          >
            <Play className="w-4 h-4" /> Начать
          </motion.button>
        </motion.div>
        </GlassPanel>
      ) : phase === "complete" ? (
        /* Complete screen */
        <GlassPanel darkMode={darkMode} color="#9B8EC4" className="rounded-2xl">
        <motion.div className="p-6 text-center"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <span style={{ fontSize: "3rem" }}>✨</span>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 12 }}>
            Сессия завершена!
          </h2>
          <p style={{ fontSize: "0.8rem", color: t.textMuted, marginTop: 8 }}>
            {Math.floor(totalTime / 60)} мин {totalTime % 60} сек полного расслабления.
            Как вы себя чувствуете?
          </p>
          <div className="flex gap-3 mt-6 justify-center">
            <button className="px-5 py-2.5 rounded-xl font-semibold"
              style={{ backgroundColor: t.sage + "18", color: t.sage, fontSize: "0.82rem" }}
              onClick={start}>
              <RotateCcw className="w-4 h-4 inline mr-1" /> Ещё раз
            </button>
            <button className="px-5 py-2.5 rounded-xl font-semibold"
              style={{ backgroundColor: t.lavender + "18", color: t.lavender, fontSize: "0.82rem" }}
              onClick={() => navigate(-1)}>
              Готово
            </button>
          </div>
        </motion.div>
        </GlassPanel>
      ) : (
        /* Active session */
        <>
          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontSize: "0.72rem", color: t.textMuted }}>
                Шаг {stepIdx + 1} из {steps.length}
              </span>
              <span style={{ fontSize: "0.68rem", color: t.textFaint }}>
                {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: t.border }}>
              <motion.div className="h-2 rounded-full"
                style={{ background: `linear-gradient(90deg, ${phaseColor}, ${phaseColor}80)` }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Current step card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${stepIdx}-${phase}`}
              className="rounded-2xl p-6 text-center border mb-4"
              style={{
                backgroundColor: t.card,
                borderColor: phaseColor + "30",
                borderWidth: 2,
              }}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {phase !== "transition" && phase !== "intro" && (
                <>
                  <span style={{ fontSize: "2.5rem", display: "block", marginBottom: 8 }}>
                    <AppIcon icon={currentStep.icon} size={40} />
                  </span>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: t.text, marginBottom: 4 }}>
                    {currentStep.muscle}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: t.textMuted, lineHeight: 1.5, marginBottom: 16 }}>
                    {currentStep.instruction}
                  </p>
                </>
              )}

              {/* Phase indicator */}
              <motion.div
                className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{ border: `3px solid ${phaseColor}` }}
                animate={phase === "tense" ? {
                  scale: [1, 1.15, 1],
                  borderColor: ["#C4876C", "#B8696C", "#C4876C"],
                } : phase === "relax" ? {
                  scale: [1.1, 1, 1],
                } : {}}
                transition={{ duration: phase === "tense" ? 1 : 2, repeat: phase === "tense" ? Infinity : 0 }}
              >
                <div className="text-center">
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, color: phaseColor }}>{timer}</div>
                  <div style={{ fontSize: "0.6rem", color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {phase === "tense" ? "сек" : "сек"}
                  </div>
                </div>
              </motion.div>

              <motion.p
                style={{
                  fontSize: phase === "tense" ? "1.1rem" : "0.9rem",
                  fontWeight: 700,
                  color: phaseColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
                animate={phase === "tense" ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                {phaseLabel}
              </motion.p>

              {phase === "relax" && (
                <motion.p style={{ fontSize: "0.72rem", color: t.textMuted, marginTop: 8, fontStyle: "italic" }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Почувствуйте контраст между напряжением и расслаблением...
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Steps overview */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {steps.map((s, i) => {
              const isDone = i < stepIdx || (i === stepIdx && (phase === "relax" || phase === "complete"));
              const isCurrent = i === stepIdx;
              return (
                <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: isDone ? t.sage + "20" : isCurrent ? phaseColor + "15" : t.bgSecondary,
                    border: isCurrent ? `2px solid ${phaseColor}40` : `1px solid ${t.border}`,
                  }}>
                  <span style={{ fontSize: isDone ? "0.55rem" : "0.7rem", filter: isDone ? "none" : i > stepIdx ? "grayscale(0.5) opacity(0.5)" : "none" }}>
                    {isDone ? "✅" : <AppIcon icon={s.icon} size={isDone ? 10 : 12} />}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cancel */}
          <button className="mt-4 w-full py-2 rounded-xl text-center"
            style={{ fontSize: "0.75rem", color: t.textFaint }}
            onClick={reset}>
            Завершить досрочно
          </button>
        </>
      )}
    </div>
  );
}