import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useTheme } from "../theme";
import { GlassPanel, MeshGradientBg, AmbientBlobs } from "../ambient-elements";

export function SuccessPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const isDark = localStorage.getItem("routine_dark_mode") === "true";
    setDarkMode(isDark);
  }, []);

  // Auto-redirect after countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate("/app");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  const perks = [
    "Безлимит привычек и рутин",
    "Все инструменты для работы с тревогой",
    "Умный ИИ-компаньон Листик",
    "Синхронизация данных в облаке",
    "Поддержка на каждом шаге",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100dvh",
        backgroundColor: t.bg,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      } as React.CSSProperties}
    >
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <MeshGradientBg darkMode={darkMode} variant="calm" />
        <AmbientBlobs variant="calm" darkMode={darkMode} />
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 480,
          margin: "0 auto",
          padding: "3rem 1.25rem 5rem",
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-8 flex items-center justify-center"
        >
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center relative"
            style={{
              background: "linear-gradient(135deg, rgba(141,181,150,0.25), rgba(123,175,176,0.2))",
              boxShadow: "0 0 60px rgba(141,181,150,0.35)",
            }}
          >
            {/* Pulse rings */}
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border"
                style={{ borderColor: "#8DB59640", inset: -16 * (i + 1) }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
              />
            ))}
            <CheckCircle2 className="w-14 h-14" style={{ color: "#8DB596" }} />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-3" style={{ color: t.text, lineHeight: 1.2 }}>
            Оплата прошла успешно!
          </h1>
          <p className="text-lg" style={{ color: t.textMuted, lineHeight: 1.6 }}>
            Добро пожаловать в Rutina Life.<br />
            Ваша подписка будет активирована в течение нескольких секунд.
          </p>
        </motion.div>

        {/* Perks card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full mb-8"
        >
          <GlassPanel darkMode={darkMode} className="p-6 rounded-2xl" color="#8DB596">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" style={{ color: "#8DB596" }} />
              <span className="font-semibold" style={{ color: t.text, fontSize: "0.95rem" }}>
                Что теперь доступно
              </span>
            </div>
            <div className="space-y-2.5">
              {perks.map((perk, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + idx * 0.08 }}
                  className="flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#8DB596" }} />
                  <span style={{ color: t.text, fontSize: "0.9rem" }}>{perk}</span>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="w-full"
        >
          <motion.button
            className="w-full py-4 rounded-xl font-semibold text-lg shadow-lg flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #8DB596, #7EA8BE)",
              color: "white",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/app")}
          >
            Перейти в приложение
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <motion.p
            className="text-center mt-3"
            style={{ color: t.textMuted, fontSize: "0.8rem" }}
            animate={{ opacity: countdown > 0 ? 1 : 0 }}
          >
            Автоматический переход через {countdown} сек
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
