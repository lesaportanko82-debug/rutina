import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "./app-context";
import { useTheme } from "./theme";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, X, Settings, Coffee, Brain, ChevronUp, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

type TimerPhase = "work" | "shortBreak" | "longBreak";

const phaseLabels: Record<TimerPhase, { label: string; color: string; icon: typeof Brain }> = {
  work: { label: "Фокус", color: "#7B8F71", icon: Brain },
  shortBreak: { label: "Короткий отдых", color: "#7BAFB0", icon: Coffee },
  longBreak: { label: "Долгий отдых", color: "#7EA8BE", icon: Coffee },
};

export function PomodoroTimer() {
  const { pomodoroSettings, updatePomodoroSettings, completePomodoroSession, pomodoroStats } = useApp();
  const t = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>("work");
  const [secondsLeft, setSecondsLeft] = useState(pomodoroSettings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = phase === "work"
    ? pomodoroSettings.workMinutes * 60
    : phase === "shortBreak"
    ? pomodoroSettings.shortBreakMinutes * 60
    : pomodoroSettings.longBreakMinutes * 60;

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const playSound = useCallback(() => {
    if (!pomodoroSettings.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 528;
      oscillator.type = "sine";
      gain.gain.value = 0.3;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      oscillator.stop(ctx.currentTime + 1.5);
    } catch {}
  }, [pomodoroSettings.soundEnabled]);

  const handlePhaseComplete = useCallback(() => {
    setIsRunning(false);
    playSound();
    if (phase === "work") {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      completePomodoroSession();
      toast.success(`Сессия #${newCount} завершена! +25 XP 🌿`, { duration: 3000 });

      if (newCount % pomodoroSettings.sessionsBeforeLong === 0) {
        setPhase("longBreak");
        setSecondsLeft(pomodoroSettings.longBreakMinutes * 60);
        toast("Заслуженный отдых — побудьте с собой", { duration: 3000 });
      } else {
        setPhase("shortBreak");
        setSecondsLeft(pomodoroSettings.shortBreakMinutes * 60);
        toast("Небольшой перерыв — вы это заслужили", { duration: 3000 });
      }

      if (pomodoroSettings.autoStart) setTimeout(() => setIsRunning(true), 1000);
    } else {
      setPhase("work");
      setSecondsLeft(pomodoroSettings.workMinutes * 60);
      toast("Время фокуса — вы справитесь!", { duration: 3000 });
      if (pomodoroSettings.autoStart) setTimeout(() => setIsRunning(true), 1000);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(phase === "work" ? "Время отдохнуть" : "Время фокуса", {
        body: phase === "work" ? "Вы отлично поработали. Отдохните." : "Перерыв окончен. Возвращаемся к делу.",
      });
    }
  }, [phase, sessionCount, pomodoroSettings, completePomodoroSession, playSound]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handlePhaseComplete]);

  const handleReset = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("work");
    setSecondsLeft(pomodoroSettings.workMinutes * 60);
    setSessionCount(0);
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const currentPhase = phaseLabels[phase];
  const PhaseIcon = currentPhase.icon;

  // Expose open event
  useEffect(() => {
    const handler = () => { setIsOpen(true); requestNotificationPermission(); };
    document.addEventListener("open-pomodoro", handler);
    return () => document.removeEventListener("open-pomodoro", handler);
  }, []);

  // Expose state for FloatingDock
  useEffect(() => {
    document.dispatchEvent(new CustomEvent("pomodoro-state", {
      detail: { isRunning, time: formatTime(secondsLeft), color: currentPhase.color, phase },
    }));
  }, [isRunning, secondsLeft, phase]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setIsOpen(false)} />
            <motion.div
              className="relative w-full max-w-[430px] rounded-t-3xl md:rounded-3xl p-6 pb-10 md:pb-6"
              style={{ backgroundColor: "#FAF8F5" }}
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "1.3rem" }}>🍅</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4A4540" }}>Помодоро</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#F0EDE8" }}
                  >
                    <Settings className="w-4 h-4" style={{ color: "#9B9489" }} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#F0EDE8" }}
                  >
                    <X className="w-4 h-4" style={{ color: "#9B9489" }} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    className="rounded-2xl p-4 mb-5 border"
                    style={{ backgroundColor: "#F5F0E8", borderColor: "#E8E3DC" }}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {[
                      { label: "Работа (мин)", key: "workMinutes" as const, value: pomodoroSettings.workMinutes, min: 5, max: 60 },
                      { label: "Короткий отдых (мин)", key: "shortBreakMinutes" as const, value: pomodoroSettings.shortBreakMinutes, min: 1, max: 15 },
                      { label: "Долгий отдых (мин)", key: "longBreakMinutes" as const, value: pomodoroSettings.longBreakMinutes, min: 5, max: 30 },
                      { label: "Сессий до отдыха", key: "sessionsBeforeLong" as const, value: pomodoroSettings.sessionsBeforeLong, min: 2, max: 8 },
                    ].map((s) => (
                      <div key={s.key} className="flex items-center justify-between py-2">
                        <span style={{ fontSize: "0.8rem", color: "#6B665F" }}>{s.label}</span>
                        <div className="flex items-center gap-2">
                          <button
                            className="w-7 h-7 rounded-lg border flex items-center justify-center"
                            style={{ backgroundColor: "#FAF8F5", borderColor: "#E5E0D8" }}
                            onClick={() => {
                              if (s.value > s.min) {
                                updatePomodoroSettings({ [s.key]: s.value - 1 });
                                if (s.key === "workMinutes" && phase === "work" && !isRunning) setSecondsLeft((s.value - 1) * 60);
                              }
                            }}
                          >
                            <ChevronDown className="w-3.5 h-3.5" style={{ color: "#9B9489" }} />
                          </button>
                          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#4A4540", minWidth: 24, textAlign: "center" }}>{s.value}</span>
                          <button
                            className="w-7 h-7 rounded-lg border flex items-center justify-center"
                            style={{ backgroundColor: "#FAF8F5", borderColor: "#E5E0D8" }}
                            onClick={() => {
                              if (s.value < s.max) {
                                updatePomodoroSettings({ [s.key]: s.value + 1 });
                                if (s.key === "workMinutes" && phase === "work" && !isRunning) setSecondsLeft((s.value + 1) * 60);
                              }
                            }}
                          >
                            <ChevronUp className="w-3.5 h-3.5" style={{ color: "#9B9489" }} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 mt-2 pt-3" style={{ borderTop: "1px solid #E8E3DC" }}>
                      <span style={{ fontSize: "0.8rem", color: "#6B665F" }}>Авто-старт</span>
                      <button
                        className="w-11 h-6 rounded-full transition-colors"
                        style={{ backgroundColor: pomodoroSettings.autoStart ? "#8DB596" : "#CABFB2" }}
                        onClick={() => updatePomodoroSettings({ autoStart: !pomodoroSettings.autoStart })}
                      >
                        <motion.div
                          className="w-5 h-5 rounded-full bg-white shadow-sm"
                          animate={{ x: pomodoroSettings.autoStart ? 22 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-2 mt-2 pt-3" style={{ borderTop: "1px solid #E8E3DC" }}>
                      <span style={{ fontSize: "0.8rem", color: "#6B665F" }}>Звук</span>
                      <button
                        className="w-11 h-6 rounded-full transition-colors"
                        style={{ backgroundColor: pomodoroSettings.soundEnabled ? "#8DB596" : "#CABFB2" }}
                        onClick={() => updatePomodoroSettings({ soundEnabled: !pomodoroSettings.soundEnabled })}
                      >
                        <motion.div
                          className="w-5 h-5 rounded-full bg-white shadow-sm"
                          animate={{ x: pomodoroSettings.soundEnabled ? 22 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          {pomodoroSettings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" style={{ color: "#9B9489" }} /> : <VolumeX className="w-3.5 h-3.5" style={{ color: "#9B9489" }} />}
                        </motion.div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase tabs */}
              <div className="flex gap-2 mb-6">
                {(["work", "shortBreak", "longBreak"] as TimerPhase[]).map((p) => (
                  <button
                    key={p}
                    className="flex-1 py-2 rounded-xl transition-all"
                    style={{
                      backgroundColor: phase === p ? phaseLabels[p].color : "#F0EDE8",
                      color: phase === p ? "#fff" : "#9B9489",
                      fontSize: "0.7rem",
                      fontWeight: 500,
                    }}
                    onClick={() => {
                      if (!isRunning) {
                        setPhase(p);
                        setSecondsLeft(
                          p === "work" ? pomodoroSettings.workMinutes * 60
                          : p === "shortBreak" ? pomodoroSettings.shortBreakMinutes * 60
                          : pomodoroSettings.longBreakMinutes * 60
                        );
                      }
                    }}
                  >
                    {phaseLabels[p].label}
                  </button>
                ))}
              </div>

              {/* Timer circle */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="#E8E3DC" strokeWidth="8" />
                    <motion.circle
                      cx="100" cy="100" r="85" fill="none"
                      stroke={currentPhase.color}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 85}
                      style={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - (progress || 0) / 100) }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - (progress || 0) / 100) }}
                      transition={{ duration: 0.5 }}
                      opacity={0.7}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <PhaseIcon className="w-6 h-6 mb-1" style={{ color: currentPhase.color }} />
                    <span style={{ fontSize: "2.5rem", fontWeight: 700, color: "#4A4540", fontVariantNumeric: "tabular-nums" }}>
                      {formatTime(secondsLeft)}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#9B9489" }}>{currentPhase.label}</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mb-5">
                <motion.button
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#F0EDE8" }}
                  onClick={handleReset}
                  whileTap={{ scale: 0.9 }}
                >
                  <RotateCcw className="w-5 h-5" style={{ color: "#9B9489" }} />
                </motion.button>
                <motion.button
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: currentPhase.color }}
                  onClick={() => setIsRunning(!isRunning)}
                  whileTap={{ scale: 0.9 }}
                >
                  {isRunning ? (
                    <Pause className="w-7 h-7 text-white" />
                  ) : (
                    <Play className="w-7 h-7 text-white ml-1" />
                  )}
                </motion.button>
                <div className="w-12 h-12 flex items-center justify-center">
                  <div className="text-center">
                    <span className="block" style={{ fontSize: "1rem", fontWeight: 700, color: "#4A4540" }}>
                      {sessionCount}
                    </span>
                    <span style={{ fontSize: "0.55rem", color: "#B5AFA6" }}>сессий</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl p-3 text-center border" style={{ backgroundColor: "#F2EFF8", borderColor: "#DDD8EC" }}>
                  <span className="block" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#9B8EC4" }}>
                    {pomodoroStats.totalSessions}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "#9B9489" }}>Всего сессий</span>
                </div>
                <div className="flex-1 rounded-xl p-3 text-center border" style={{ backgroundColor: "#F8F3ED", borderColor: "#E8E0D4" }}>
                  <span className="block" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#C4876C" }}>
                    {pomodoroStats.totalMinutes}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "#9B9489" }}>Минут фокуса</span>
                </div>
                <div className="flex-1 rounded-xl p-3 text-center border" style={{ backgroundColor: "#EDF5EF", borderColor: "#D5E5D8" }}>
                  <span className="block" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#8DB596" }}>
                    {Math.round(pomodoroStats.totalMinutes / 60 * 10) / 10}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "#9B9489" }}>Часов всего</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}