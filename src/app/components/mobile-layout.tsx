import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PAYMENTS_ENABLED } from "./payments-config";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, ListChecks, Repeat, Smile, User, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase, projectId } from "./supabase-client";
import { useApp } from "./app-context";
import { PomodoroTimer } from "./pomodoro-timer";
import { CelebrationOverlay } from "./confetti";
import { Onboarding } from "./onboarding";
import { Toaster } from "sonner";
import { getThemeColors } from "./theme";
import { FeatureTour, dashboardTour, tasksTour, habitsTour, moodTour, profileTour } from "./feature-tour";
import { BreathingWidget } from "./breathing-widget";
import { LeafMascot } from "./leaf-mascot";
import { FloatingDock } from "./floating-dock";
import { AmbientBlobs, SparkleField, MeshGradientBg } from "./ambient-elements";

const PAYMENT_ENDPOINT = "https://oqucupnybysgiekdagzu.supabase.co/functions/v1/create-payment-rutina";

const tabs = [
  { path: "/app", icon: Home, label: "Главная" },
  { path: "/app/tasks", icon: ListChecks, label: "Задачи" },
  { path: "/app/habits", icon: Repeat, label: "Привычки" },
  { path: "/app/mood", icon: Smile, label: "Настроение" },
  { path: "/app/profile", icon: User, label: "Профиль" },
];

const tourMap: Record<string, { key: string; steps: typeof dashboardTour }> = {
  "/app": { key: "tour-dashboard", steps: dashboardTour },
  "/app/tasks": { key: "tour-tasks", steps: tasksTour },
  "/app/habits": { key: "tour-habits", steps: habitsTour },
  "/app/mood": { key: "tour-mood", steps: moodTour },
  "/app/profile": { key: "tour-profile", steps: profileTour },
};

export function MobileLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, onboardingDone, seenTours, markTourSeen } = useApp();
  const t = getThemeColors(darkMode);

  // ─── Track input focus to hide bottom nav ───
  const [inputFocused, setInputFocused] = useState(false);
  const inputFocusTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    const container = document.querySelector("[data-mobile-root]");
    if (!container) return;

    const onFocusIn = (e: Event) => {
      const el = e.target as HTMLElement;
      if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.getAttribute("contenteditable") === "true"
      ) {
        // Don't hide for file inputs, range sliders, etc.
        const type = (el as HTMLInputElement).type;
        if (type === "file" || type === "range" || type === "checkbox" || type === "radio" || type === "color") return;
        clearTimeout(inputFocusTimer.current);
        setInputFocused(true);

        // Broadcast input focus event for other components (FloatingDock, etc.)
        document.dispatchEvent(new CustomEvent("input-focus-change", { detail: { focused: true } }));

        // Controlled scroll to input — prevent layout jumps
        requestAnimationFrame(() => {
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      }
    };

    const onFocusOut = () => {
      // Small delay to avoid flicker when switching between inputs
      inputFocusTimer.current = setTimeout(() => {
        const active = document.activeElement;
        if (
          active &&
          (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.getAttribute("contenteditable") === "true")
        ) {
          const type = (active as HTMLInputElement).type;
          if (type !== "file" && type !== "range" && type !== "checkbox" && type !== "radio" && type !== "color") return;
        }
        setInputFocused(false);
      }, 120);
    };

    // Also broadcast unfocus
    const origOnFocusOut = onFocusOut;
    const wrappedFocusOut = () => {
      origOnFocusOut();
      // Broadcast after same delay
      setTimeout(() => {
        const active = document.activeElement;
        const isStillFocused = active && (
          active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.getAttribute("contenteditable") === "true"
        );
        if (isStillFocused) {
          const type = (active as HTMLInputElement).type;
          if (type !== "file" && type !== "range" && type !== "checkbox" && type !== "radio" && type !== "color") return;
        }
        document.dispatchEvent(new CustomEvent("input-focus-change", { detail: { focused: false } }));
      }, 130);
    };

    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", wrappedFocusOut);
    return () => {
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", wrappedFocusOut);
      clearTimeout(inputFocusTimer.current);
    };
  }, []);

  // Stable viewport height — lock on mount to prevent keyboard resize shifts
  const [stableHeight, setStableHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    // Capture initial full viewport height before any keyboard opens
    const h = window.innerHeight;
    setStableHeight(h);
    setIsDesktop(window.innerWidth >= 768);

    // Use visualViewport to detect keyboard, but keep layout stable
    const vv = window.visualViewport;
    if (vv) {
      let initialH = vv.height;
      const onResize = () => {
        // Only update if viewport GREW (keyboard closed / orientation change)
        if (vv.height > initialH) {
          initialH = vv.height;
          setStableHeight(vv.height);
        }
        setIsDesktop(window.innerWidth >= 768);
      };
      vv.addEventListener("resize", onResize);
      return () => vv.removeEventListener("resize", onResize);
    }

    // Fallback: listen to resize for orientation changes
    const onResize = () => {
      setIsDesktop(window.innerWidth >= 768);
      setStableHeight(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const containerHeight = stableHeight
    ? (isDesktop ? Math.min(stableHeight, 850) : stableHeight)
    : undefined;

  // Parallax scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollY(scrollRef.current.scrollTop);
    }
  }, []);

  // Smooth reset scrollY on page change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    setScrollY(0);
  }, [location.pathname]);

  // Auto-detect time-of-day for gradient variant
  const meshVariant = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 21 || h < 5) return "night" as const;
    if (h >= 17) return "warm" as const;
    if (h >= 5 && h < 10) return "calm" as const;
    return "default" as const;
  }, []);

  // Fade-out thresholds per variant (night fades slower, warm/calm faster)
  const fadeConfig = useMemo(() => {
    switch (meshVariant) {
      case "night":  return { meshDist: 1800, meshFloor: 0.05, ambDist: 2200, ambFloor: 0.2 };
      case "warm":   return { meshDist: 1000, meshFloor: 0,    ambDist: 1300, ambFloor: 0.12 };
      case "calm":   return { meshDist: 1100, meshFloor: 0,    ambDist: 1400, ambFloor: 0.15 };
      default:       return { meshDist: 1200, meshFloor: 0,    ambDist: 1500, ambFloor: 0.15 };
    }
  }, [meshVariant]);

  // Track pomodoro state for dock display
  const [pomodoroState, setPomodoroState] = useState<{
    isRunning: boolean; time: string; color: string;
  }>({ isRunning: false, time: "25:00", color: "#7B8F71" });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setPomodoroState(detail);
    };
    document.addEventListener("pomodoro-state", handler);
    return () => document.removeEventListener("pomodoro-state", handler);
  }, []);

  // ─── Auth + subscription gate ───
  const [authReady, setAuthReady] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;

      if (!data.session) {
        navigate("/auth?next=app", { replace: true });
        return;
      }

      // Admin always gets full access
      if (data.session.user.id === "admin") {
        setIsPremium(true);
        setAuthReady(true);
        return;
      }

      setAuthReady(true);

      // Payments are switched off — everyone signed in gets full access
      if (!PAYMENTS_ENABLED) {
        setIsPremium(true);
        return;
      }

      // Check subscription status
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ff738703/subscription/${data.session.user.id}`,
          { headers: { Authorization: `Bearer ${data.session.access_token}` } }
        );
        if (cancelled) return;
        if (res.ok) {
          const sub = await res.json();
          setIsPremium(sub.status === "active");
        } else {
          setIsPremium(false);
        }
      } catch {
        if (!cancelled) setIsPremium(false);
      }
    }).catch(() => {
      if (!cancelled) navigate("/auth?next=app", { replace: true });
    });

    return () => { cancelled = true; };
  }, []);

  const handleTabClick = useCallback((path: string, label: string) => {
    if (isPremium === false && path !== "/app") {
      setBlockedFeature(label);
      setShowUpgradeSheet(true);
      return;
    }
    navigate(path);
  }, [isPremium, navigate]);

  const handlePayFromApp = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.href = "/?action=pay";
        return;
      }
      const response = await fetch(PAYMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionData.session.user.id,
          email: sessionData.session.user.email ?? "",
          plan: "monthly",
          returnUrl: `${window.location.origin}/success`,
        }),
      });
      const data = await response.json();
      if (data.success && data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else {
        console.error("Payment failed:", data);
        alert("Ошибка создания платежа: " + (data.error || "неизвестная ошибка"));
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      alert("Ошибка создания платежа: " + (err?.message || err));
    } finally {
      setPaymentLoading(false);
    }
  }, []);

  // Auth loading screen
  if (!authReady) {
    return (
      <div
        className="h-dvh flex items-center justify-center relative overflow-hidden"
        style={{ background: darkMode ? "#1A1918" : "#FAF8F5" }}
      >
        <MeshGradientBg darkMode={darkMode} variant="calm" />
        <AmbientBlobs darkMode={darkMode} variant="calm" />
        <div className="relative z-[1] text-center">
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(141,181,150,0.15), rgba(155,142,196,0.12))",
              boxShadow: "0 8px 32px rgba(141,181,150,0.1)",
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span style={{ fontSize: "2.2rem" }}>🌿</span>
          </motion.div>
          <motion.p
            style={{ fontSize: "0.82rem", color: "#9B9489", fontWeight: 500 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Загрузка...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!onboardingDone) {
    return <Onboarding />;
  }

  const currentTour = tourMap[location.pathname];

  return (
    <>
      <Toaster position="top-center" richColors />
      <CelebrationOverlay />
      <div
        className="flex items-center justify-center relative overflow-hidden"
        style={{
          fontFamily: "'Inter', sans-serif",
          height: stableHeight ? `${stableHeight}px` : '100dvh',
          minHeight: stableHeight ? `${stableHeight}px` : '100dvh',
          background: darkMode
            ? "linear-gradient(135deg, #1A1918 0%, #1E1D1C 40%, #1A1918 100%)"
            : "linear-gradient(135deg, #F0EDE8 0%, #EDE9E2 30%, #F2EFE9 60%, #F0EDE8 100%)",
        }}
      >
        <div
          className="w-full max-w-[430px] md:rounded-[2.5rem] md:shadow-2xl md:border flex flex-col overflow-hidden relative"
          data-mobile-root
          style={{
            borderColor: darkMode ? "#3A373430" : "#E8E3DC60",
            height: stableHeight ? `${containerHeight}px` : '100dvh',
          }}
        >
          {/* Animated mesh gradient background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: Math.max(fadeConfig.meshFloor, 1 - scrollY / fadeConfig.meshDist),
              willChange: "opacity",
              transition: "opacity 0.3s ease-out",
            }}
          >
            <MeshGradientBg darkMode={darkMode} variant={meshVariant} />
          </div>

          {/* Ambient decorative blobs + sparkles */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: Math.max(fadeConfig.ambFloor, 1 - scrollY / fadeConfig.ambDist),
              willChange: "opacity",
              transition: "opacity 0.35s ease-out",
            }}
          >
            <AmbientBlobs darkMode={darkMode} variant={meshVariant === "warm" ? "focus" : meshVariant} />
            <SparkleField count={meshVariant === "night" ? 15 : 10} darkMode={darkMode} />
          </div>

          {/* Free mode banner */}
          {isPremium === false && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-[2] flex items-center justify-between px-4 py-2.5 flex-shrink-0"
              style={{
                background: darkMode
                  ? "rgba(141,181,150,0.08)"
                  : "linear-gradient(90deg, rgba(141,181,150,0.12), rgba(123,175,176,0.08))",
                borderBottom: `1px solid rgba(141,181,150,0.2)`,
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: "0.8rem" }}>🌿</span>
                <span style={{ fontSize: "0.72rem", color: "#8DB596", fontWeight: 600 }}>
                  Бесплатный режим
                </span>
                <span style={{ fontSize: "0.65rem", color: "#9B9489" }}>· Просмотр</span>
              </div>
              <motion.button
                onClick={handlePayFromApp}
                disabled={paymentLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #8DB596, #7EA8BE)",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  opacity: paymentLoading ? 0.7 : 1,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {paymentLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Оформить — 500 ₽/мес"
                )}
              </motion.button>
            </motion.div>
          )}

          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden pb-28 relative z-[1]">
            <Outlet />
          </div>

          {/* Bottom nav */}
          <motion.div
            className="absolute left-0 right-0 px-1 pb-[env(safe-area-inset-bottom)]"
            animate={{
              bottom: inputFocused ? -80 : 0,
              opacity: inputFocused ? 0 : 1,
            }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{
              pointerEvents: inputFocused ? "none" : "auto",
              backgroundColor: darkMode ? "rgba(26,25,24,0.85)" : "rgba(250,248,245,0.75)",
              backdropFilter: "blur(24px) saturate(1.3)",
              WebkitBackdropFilter: "blur(24px) saturate(1.3)",
              borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"}`,
              boxShadow: darkMode
                ? "0 -4px 20px rgba(0,0,0,0.3)"
                : "0 -4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)",
              zIndex: 10,
            }}
          >
            <div className="flex items-center justify-around py-2.5">
              {tabs.map((tab) => {
                const isActive = tab.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(tab.path);
                return (
                  <button
                    key={tab.path}
                    onClick={() => handleTabClick(tab.path, tab.label)}
                    className="flex flex-col items-center gap-0.5 px-3 py-1 relative"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -top-2.5 w-8 h-1 rounded-full"
                        style={{ backgroundColor: t.sage }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <tab.icon
                      className="w-[20px] h-[20px] transition-colors"
                      style={{ color: isActive ? "#6B8F71" : t.textFaint }}
                    />
                    <span
                      className="transition-colors"
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#6B8F71" : t.textFaint,
                      }}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <PomodoroTimer />
          <BreathingWidget />
          <LeafMascot />
          <FloatingDock
            pomodoroActive={pomodoroState.isRunning}
            pomodoroTime={pomodoroState.time}
            pomodoroColor={pomodoroState.color}
          />

          {/* Upgrade sheet — shown when free user taps a premium tab */}
          <AnimatePresence>
            {showUpgradeSheet && (
              <motion.div
                className="absolute inset-0 z-[60] flex flex-col justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  backgroundColor: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
                onClick={() => setShowUpgradeSheet(false)}
              >
                <motion.div
                  className="rounded-t-3xl px-6 pt-6 pb-8"
                  style={{
                    backgroundColor: darkMode ? "#1E1D1C" : "#FAF8F5",
                    borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(141,181,150,0.2)"}`,
                  }}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 26, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Handle */}
                  <div className="flex justify-center mb-5">
                    <div
                      className="w-10 h-1 rounded-full"
                      style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }}
                    />
                  </div>

                  <div className="text-center mb-5">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{
                        background: "linear-gradient(135deg, rgba(141,181,150,0.18), rgba(123,175,176,0.12))",
                      }}
                    >
                      <Lock className="w-7 h-7" style={{ color: "#8DB596" }} />
                    </div>
                    <h3
                      className="font-bold mb-2"
                      style={{ fontSize: "1.1rem", color: t.text }}
                    >
                      {blockedFeature} — Premium
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: t.textMuted, lineHeight: 1.55 }}>
                      Оформите подписку, чтобы получить полный доступ ко всем функциям приложения
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {[
                      "Безлимит привычек, задач и рутин",
                      "Трекер настроения, сна и тревоги",
                      "ИИ-компаньон Листик",
                      "Дневник и инструменты роста",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#8DB596" }} />
                        <span style={{ fontSize: "0.87rem", color: t.text }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    onClick={handlePayFromApp}
                    disabled={paymentLoading}
                    className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #8DB596, #7EA8BE)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      opacity: paymentLoading ? 0.7 : 1,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {paymentLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Оформить подписку — 500 ₽/мес"
                    )}
                  </motion.button>

                  <button
                    onClick={() => setShowUpgradeSheet(false)}
                    className="w-full mt-3 py-2.5 text-center"
                    style={{ fontSize: "0.85rem", color: t.textMuted }}
                  >
                    Закрыть
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Contextual feature tour */}
      {currentTour && (
        <FeatureTour
          key={currentTour.key}
          tourKey={currentTour.key}
          steps={currentTour.steps}
          seenTours={seenTours}
          onComplete={markTourSeen}
          delay={1000}
        />
      )}
    </>
  );
}