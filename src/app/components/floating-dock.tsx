import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./theme";
import { useApp } from "./app-context";
import { Wind, Timer, Leaf, X, GripVertical } from "lucide-react";

const DOCK_SEEN_KEY = "routine_dock_intro_seen";

interface FloatingDockProps {
  pomodoroActive?: boolean;
  pomodoroTime?: string;
  pomodoroColor?: string;
}

export function FloatingDock({ pomodoroActive, pomodoroTime, pomodoroColor }: FloatingDockProps) {
  const t = useTheme();
  const { darkMode } = useApp();
  const [expanded, setExpanded] = useState(true);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isLandscape, setIsLandscape] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Hide dock when text input is focused (keyboard open)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setInputFocused(detail.focused);
    };
    document.addEventListener("input-focus-change", handler);
    return () => document.removeEventListener("input-focus-change", handler);
  }, []);

  // Detect landscape mode
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth > 500);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // First-time hint animation
  useEffect(() => {
    const seen = localStorage.getItem(DOCK_SEEN_KEY);
    if (!seen) {
      const timer = setTimeout(() => {
        setShowHint(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-dismiss hint after 5s
  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(() => {
      setShowHint(false);
      setHintDismissed(true);
      localStorage.setItem(DOCK_SEEN_KEY, "1");
    }, 5000);
    return () => clearTimeout(timer);
  }, [showHint]);

  const dismissHint = () => {
    setShowHint(false);
    setHintDismissed(true);
    localStorage.setItem(DOCK_SEEN_KEY, "1");
  };

  const openPomodoro = () => {
    dismissHint();
    document.dispatchEvent(new CustomEvent("open-pomodoro"));
  };

  const openBreathing = () => {
    dismissHint();
    document.dispatchEvent(new CustomEvent("open-breathing"));
  };

  const openMascot = () => {
    dismissHint();
    document.dispatchEvent(new CustomEvent("open-mascot"));
  };

  const dockItems = [
    {
      id: "pomodoro",
      icon: <Timer className="w-4 h-4" />,
      emoji: "🍅",
      label: pomodoroActive ? pomodoroTime : undefined,
      gradient: pomodoroActive
        ? `linear-gradient(135deg, ${pomodoroColor || "#7B8F71"}, ${pomodoroColor || "#7B8F71"}CC)`
        : "linear-gradient(135deg, #A3907A, #8D7F6B)",
      onClick: openPomodoro,
      pulse: pomodoroActive,
      hint: "Помидоро",
    },
    {
      id: "breathing",
      icon: <Wind className="w-4 h-4" />,
      emoji: undefined,
      label: undefined,
      gradient: "linear-gradient(135deg, #7EA8BE, #9B8EC4)",
      onClick: openBreathing,
      pulse: false,
      hint: "Дыхание",
    },
    {
      id: "mascot",
      icon: <Leaf className="w-4 h-4" />,
      emoji: "🍃",
      label: undefined,
      gradient: darkMode
        ? "linear-gradient(135deg, #4ADB65, #2AAF48)"
        : "linear-gradient(135deg, #B8F5C5, #5DC26E)",
      onClick: openMascot,
      pulse: false,
      hint: "Листик",
    },
  ];

  return (
    <motion.div
      className="absolute z-40"
      style={{
        bottom: isLandscape ? 16 + dragOffset.y : 80 + dragOffset.y,
        right: isLandscape ? undefined : 10 - dragOffset.x,
        left: isLandscape ? 10 - dragOffset.x : undefined,
      }}
      animate={{
        opacity: inputFocused ? 0 : 1,
        scale: inputFocused ? 0.8 : 1,
        y: inputFocused ? 40 : 0,
      }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      {...(inputFocused ? { style: { ...{ bottom: isLandscape ? 16 + dragOffset.y : 80 + dragOffset.y, right: isLandscape ? undefined : 10 - dragOffset.x, left: isLandscape ? 10 - dragOffset.x : undefined }, pointerEvents: "none" as const } } : {})}
      {...(inputFocused ? {} : { drag: true })}
      dragConstraints={{ left: -300, right: 300, top: -500, bottom: 30 }}
      dragElastic={0.15}
      onDragEnd={(_, info) => {
        setDragOffset((prev) => ({
          x: prev.x - info.offset.x,
          y: prev.y - info.offset.y,
        }));
        dismissHint();
      }}
    >
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            className={`flex items-center ${isLandscape ? "flex-row gap-2" : "flex-col gap-1.5"}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Hint tooltip */}
            <AnimatePresence>
              {showHint && !hintDismissed && (
                <motion.div
                  className="absolute z-50 pointer-events-none"
                  style={{
                    ...(isLandscape
                      ? { bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)" }
                      : { right: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)" }
                    ),
                  }}
                  initial={{ opacity: 0, scale: 0.7, x: isLandscape ? 0 : 10, y: isLandscape ? 10 : 0 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div
                    className="rounded-2xl px-4 py-2.5 shadow-lg whitespace-nowrap relative"
                    style={{
                      backgroundColor: darkMode ? "#2A2D28" : "#fff",
                      border: `1px solid ${darkMode ? "rgba(141,181,150,0.3)" : "rgba(141,181,150,0.4)"}`,
                      boxShadow: `0 4px 20px ${darkMode ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.1)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <motion.span
                        style={{ fontSize: "1rem" }}
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🌿
                      </motion.span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text }}>
                        Виджеты
                      </span>
                    </div>
                    <p style={{ fontSize: "0.65rem", color: t.textMuted, marginTop: 2 }}>
                      Помидоро, дыхание, Листик
                    </p>
                    {/* Arrow */}
                    <div
                      className="absolute"
                      style={{
                        ...(isLandscape
                          ? {
                              bottom: -6,
                              left: "50%",
                              marginLeft: -6,
                              width: 0,
                              height: 0,
                              borderLeft: "6px solid transparent",
                              borderRight: "6px solid transparent",
                              borderTop: `6px solid ${darkMode ? "#2A2D28" : "#fff"}`,
                            }
                          : {
                              right: -6,
                              top: "50%",
                              marginTop: -6,
                              width: 0,
                              height: 0,
                              borderTop: "6px solid transparent",
                              borderBottom: "6px solid transparent",
                              borderLeft: `6px solid ${darkMode ? "#2A2D28" : "#fff"}`,
                            }
                        ),
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dock items */}
            {dockItems.map((item, i) => (
              <motion.div key={item.id} className="relative">
                <motion.button
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md relative"
                  style={{
                    background: item.gradient,
                    boxShadow: `0 2px 12px ${darkMode ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.12)"}`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick();
                  }}
                  whileTap={{ scale: 0.85 }}
                  initial={{ opacity: 0, [isLandscape ? "y" : "x"]: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 20 }}
                >
                  {item.label ? (
                    <span className="text-white" style={{ fontSize: "0.6rem", fontWeight: 700 }}>
                      {item.label}
                    </span>
                  ) : item.emoji ? (
                    <span style={{ fontSize: "1.1rem" }}>{item.emoji}</span>
                  ) : (
                    <span className="text-white">{item.icon}</span>
                  )}

                  {/* Pulse ring for active pomodoro */}
                  {item.pulse && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2"
                      style={{ borderColor: pomodoroColor || "#7B8F71" }}
                      animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.button>

                {/* Item labels on first show */}
                <AnimatePresence>
                  {showHint && !hintDismissed && (
                    <motion.span
                      className="absolute pointer-events-none whitespace-nowrap"
                      style={{
                        ...(isLandscape
                          ? { top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)" }
                          : { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" }
                        ),
                        fontSize: "0.58rem",
                        fontWeight: 600,
                        color: t.textMuted,
                        backgroundColor: darkMode ? "rgba(42,45,40,0.85)" : "rgba(255,255,255,0.85)",
                        padding: "2px 6px",
                        borderRadius: 6,
                        backdropFilter: "blur(4px)",
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      {item.hint}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Collapse button */}
            <motion.button
              className={`w-7 h-7 rounded-full flex items-center justify-center ${isLandscape ? "ml-0.5" : "mt-0.5"}`}
              style={{
                backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
                dismissHint();
              }}
              whileTap={{ scale: 0.8 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="w-3 h-3" style={{ color: t.textFaint }} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            style={{
              background: darkMode
                ? "linear-gradient(135deg, rgba(141,181,150,0.3), rgba(126,168,190,0.3))"
                : "linear-gradient(135deg, rgba(141,181,150,0.5), rgba(126,168,190,0.5))",
              backdropFilter: "blur(12px)",
              border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            whileTap={{ scale: 0.85 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <GripVertical className="w-4 h-4" style={{ color: darkMode ? "#8DB596" : "#6B8F71" }} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}