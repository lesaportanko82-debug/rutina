import { useState, useEffect, useCallback } from "react";
import { PAYMENTS_ENABLED } from "../payments-config";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useTheme } from "../theme";
import { GlassPanel, AmbientBlobs, SparkleField, MeshGradientBg } from "../ambient-elements";
import { AppIcon } from "../app-icon";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { supabase } from "../supabase-client";

const PAYMENT_ENDPOINT = "https://oqucupnybysgiekdagzu.supabase.co/functions/v1/create-payment-rutina";

const features = [
  {
    emoji: "🔁",
    title: "Ежедневные рутины",
    description: "Сценарии дня, которые не нужно каждый раз придумывать заново",
    color: "#8DB596",
  },
  {
    emoji: "✅",
    title: "Привычки",
    description: "Повторяющиеся действия, которые становятся автоматизмом",
    color: "#9B8EC4",
  },
  {
    emoji: "🔔",
    title: "Напоминания",
    description: "Мягко возвращают вас к системе",
    color: "#C4876C",
  },
  {
    emoji: "📊",
    title: "Трекер прогресса",
    description: "Вы видите, как двигаетесь",
    color: "#7EA8BE",
  },
  {
    emoji: "📅",
    title: "Структура дня",
    description: "Понимаете, что и когда делать",
    color: "#C4A86C",
  },
  {
    emoji: "🎯",
    title: "Фокус",
    description: "Меньше лишнего — больше результата",
    color: "#B88FA7",
  },
  {
    emoji: "💚",
    title: "Снижение перегруза",
    description: "Система убирает хаос",
    color: "#7BAFB0",
  },
  {
    emoji: "⚡",
    title: "Простота",
    description: "Без сложных инструментов",
    color: "#C4876C",
  },
];

const beforeAfter = {
  before: [
    "Хаос в действиях",
    "Постоянная перегрузка",
    "Нестабильность",
    "Всё держите в голове",
  ],
  after: [
    "Структура и порядок",
    "Контроль над днём",
    "Спокойствие",
    "Понятная система",
  ],
};

const steps = [
  { number: 1, text: "Добавляете привычки" },
  { number: 2, text: "Формируете рутину" },
  { number: 3, text: "Повторяете каждый день" },
  { number: 4, text: "Видите результат" },
];

export function OnboardingPricingPage() {
  const t = useTheme();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRutinaPayment = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      navigate("/auth?next=pay");
      return;
    }

    const userId = sessionData.session.user.id;
    const email = sessionData.session.user.email ?? "";

    setLoading(true);
    try {
      const response = await fetch(PAYMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          plan: "monthly",
          returnUrl: `${window.location.origin}/success`,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.confirmationUrl) {
        console.error("Payment creation failed:", data);
        alert("Ошибка создания платежа: " + (data.error || "неизвестная ошибка"));
        return;
      }

      window.location.href = data.confirmationUrl;
    } catch (err: any) {
      console.error("Payment request error:", err);
      alert("Ошибка создания платежа: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleStartFree = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      navigate("/auth?next=app");
      return;
    }
    navigate("/app");
  }, [navigate]);

  useEffect(() => {
    const isDark = localStorage.getItem("routine_dark_mode") === "true";
    setDarkMode(isDark);

    // Auto-trigger payment if returning from auth with pay intent
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("action") === "pay") {
      window.history.replaceState({}, "", window.location.pathname);
      if (PAYMENTS_ENABLED) handleRutinaPayment();
      else navigate("/app");
    }
  }, [handleRutinaPayment, navigate]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100dvh',
      backgroundColor: t.bg,
      overflowX: 'hidden',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    } as React.CSSProperties}>
      {/* Background elements */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        <MeshGradientBg darkMode={darkMode} variant="calm" />
        <AmbientBlobs variant="calm" darkMode={darkMode} />
        <SparkleField count={12} darkMode={darkMode} />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: 800,
        margin: '0 auto',
        padding: '2rem 1rem 5rem',
        minHeight: '100%',
      }}>


        {/* 1. HERO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 mt-8"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(141,181,150,0.2), rgba(155,142,196,0.15))",
                boxShadow: "0 8px 32px rgba(141,181,150,0.15)",
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <span style={{ fontSize: "2.5rem" }}>🌿</span>
            </motion.div>
          </div>

          <h1 className="text-4xl font-bold mb-4" style={{ color: t.text, lineHeight: 1.2 }}>
            Порядок в дне —<br />порядок в жизни
          </h1>

          <p className="text-lg" style={{ color: t.textMuted, maxWidth: 500, margin: "0 auto 2.5rem" }}>
            Создайте систему привычек и действий, которая будет работать каждый день — без хаоса и перегруза
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <motion.button
              className="px-8 py-3.5 rounded-xl font-medium shadow-lg"
              style={{
                background: "linear-gradient(135deg, #8DB596, #7EA8BE)",
                color: "white",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartFree}
            >
              Попробовать бесплатно
            </motion.button>
            <motion.button
              className="px-8 py-3.5 rounded-xl font-medium"
              style={{
                backgroundColor: t.card,
                color: t.text,
                border: `1px solid ${t.border}`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Как это работает
            </motion.button>
          </div>
        </motion.div>

        {/* 2. ПРОБЛЕМА */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <GlassPanel darkMode={darkMode} className="p-8 rounded-3xl">
            <div className="text-center mb-6">
              <p className="text-xl leading-relaxed mb-4" style={{ color: t.text }}>
                Вы начинаете — но не продолжаете<br />
                Планируете — но не выполняете<br />
                Пытаетесь держать всё в голове — и перегружаетесь
              </p>

              <div className="my-8 flex justify-center">
                <div className="w-12 h-0.5 rounded-full" style={{ backgroundColor: t.border }} />
              </div>

              <p className="text-2xl font-semibold mb-2" style={{ color: t.text }}>
                Дело не в мотивации
              </p>
              <p className="text-lg" style={{ color: t.textMuted }}>
                Дело в отсутствии системы
              </p>
            </div>
          </GlassPanel>
        </motion.div>

        {/* 3. РЕШЕНИЕ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold mb-4" style={{ color: t.text }}>
            Rutina Life превращает действия<br />в повторяемую систему
          </h2>
          <p className="text-lg" style={{ color: t.textMuted }}>
            которая работает каждый день
          </p>
        </motion.div>

        {/* 4. ФУНКЦИОНАЛ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: t.text }}>
            Что внутри
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlassPanel darkMode={darkMode} color={feature.color} className="p-5 rounded-2xl h-full">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: feature.color + "20" }}
                    >
                      <AppIcon icon={feature.emoji} size={20} color={feature.color} />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: t.text, fontSize: "0.95rem" }}>
                        {feature.title}
                      </h4>
                      <p style={{ color: t.textMuted, fontSize: "0.85rem", lineHeight: 1.5 }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 5. ДО / ПОСЛЕ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* До */}
            <GlassPanel darkMode={darkMode} className="p-6 rounded-2xl">
              <div className="text-center mb-4">
                <span className="text-3xl">😓</span>
                <h4 className="font-bold mt-2 text-lg" style={{ color: t.text }}>До</h4>
              </div>
              <div className="space-y-2.5">
                {beforeAfter.before.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Circle className="w-4 h-4 flex-shrink-0" style={{ color: "#C4876C", opacity: 0.5 }} />
                    <span style={{ color: t.textMuted, fontSize: "0.9rem" }}>{item}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* После */}
            <GlassPanel darkMode={darkMode} className="p-6 rounded-2xl" color="#8DB596">
              <div className="text-center mb-4">
                <span className="text-3xl">✨</span>
                <h4 className="font-bold mt-2 text-lg" style={{ color: t.text }}>После</h4>
              </div>
              <div className="space-y-2.5">
                {beforeAfter.after.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#8DB596" }} />
                    <span style={{ color: t.text, fontSize: "0.9rem", fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </motion.div>

        {/* 6. КАК ЭТО РАБОТАЕТ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
          id="pricing"
        >
          <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: t.text }}>
            Как это работает
          </h3>

          <GlassPanel darkMode={darkMode} className="p-8 rounded-3xl">
            <div className="space-y-5">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                    style={{
                      background: "linear-gradient(135deg, #8DB596, #7EA8BE)",
                      color: "white",
                    }}
                  >
                    {step.number}
                  </div>
                  <p className="text-lg" style={{ color: t.text }}>
                    {step.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>

        {PAYMENTS_ENABLED && (<>
        {/* 7. ТАРИФ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold mb-8 text-center" style={{ color: t.text }}>
            Выберите тариф
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Полный доступ (главный) */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <GlassPanel darkMode={darkMode} className="p-8 rounded-3xl relative overflow-visible" color="#8DB596">
                {/* Бейдж "Рекомендуем" */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                  style={{
                    background: "linear-gradient(135deg, #C4A86C, #B88FA7)",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(196,168,108,0.3)",
                    zIndex: 10,
                  }}
                >
                  🔥 Рекомендуем
                </div>

                <div className="text-center mb-6" style={{ paddingTop: '2rem' }}>
                  <h4 className="text-2xl font-bold mb-2" style={{ color: t.text }}>
                    Полный доступ
                  </h4>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold" style={{ color: "#8DB596" }}>500</span>
                    <span className="text-xl" style={{ color: t.textMuted }}>₽ / месяц</span>
                  </div>
                  <p style={{ color: t.textMuted, fontSize: "0.9rem" }}>
                    Полный доступ ко всем возможностям<br />Rutina Life — без ограничений
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    "Безлимит привычек",
                    "Создание любых рутин",
                    "Напоминания",
                    "Отслеживание прогресса",
                    "Полный функционал системы",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#8DB596" }} />
                      <span style={{ color: t.text, fontSize: "0.9rem" }}>{item}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  className="w-full py-3.5 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                  style={{
                    background: loading
                      ? "linear-gradient(135deg, #8DB59688, #7EA8BE88)"
                      : "linear-gradient(135deg, #8DB596, #7EA8BE)",
                    color: "white",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  whileHover={loading ? {} : { scale: 1.02 }}
                  whileTap={loading ? {} : { scale: 0.98 }}
                  onClick={handleRutinaPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Создаём платёж...</span>
                    </>
                  ) : (
                    "Оформить доступ — 500 ₽/мес"
                  )}
                </motion.button>
              </GlassPanel>
            </motion.div>

            {/* Демо */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <GlassPanel darkMode={darkMode} className="p-8 rounded-3xl">
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold mb-2" style={{ color: t.text }}>
                    Бесплатно
                  </h4>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold" style={{ color: t.text }}>0</span>
                    <span className="text-xl" style={{ color: t.textMuted }}>₽</span>
                  </div>
                  <p style={{ color: t.textMuted, fontSize: "0.9rem" }}>
                    Посмотрите, как устроена система,<br />прежде чем начать
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    "Ограниченный доступ",
                    "Просмотр интерфейса",
                    "Без полноценного использования",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <Circle className="w-5 h-5 flex-shrink-0" style={{ color: t.textMuted, opacity: 0.5 }} />
                      <span style={{ color: t.textMuted, fontSize: "0.9rem" }}>{item}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  className="w-full py-3.5 rounded-xl font-semibold"
                  style={{
                    backgroundColor: t.card,
                    color: t.text,
                    border: `1px solid ${t.border}`,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartFree}
                >
                  Попробовать
                </motion.button>
              </GlassPanel>
            </motion.div>
          </div>
        </motion.div>

        </>)}

        {/* 8. ДОЖИМ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <GlassPanel darkMode={darkMode} className="p-8 rounded-3xl text-center">
            <p className="text-xl mb-3" style={{ color: t.text, lineHeight: 1.6 }}>
              Изменения происходят не за один день
            </p>
            <p className="text-lg" style={{ color: t.textMuted, lineHeight: 1.6 }}>
              Они происходят, когда система работает каждый день
            </p>

            <div className="my-6 flex justify-center">
              <div className="w-12 h-0.5 rounded-full" style={{ backgroundColor: t.border }} />
            </div>

            {PAYMENTS_ENABLED && (
              <p className="text-base mb-2" style={{ color: t.textMuted }}>
                500 ₽ — это меньше, чем случайные траты
              </p>
            )}
            <p className="text-lg font-medium" style={{ color: t.text }}>
              Именно система даёт результат
            </p>
          </GlassPanel>
        </motion.div>

        {/* 9. ФИНАЛЬНЫЙ CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h3 className="text-3xl font-bold mb-3" style={{ color: t.text }}>
            Начните с одного дня
          </h3>
          <p className="text-lg mb-6" style={{ color: t.textMuted }}>
            Создайте первую рутину и почувствуйте разницу
          </p>

          <motion.button
            className="px-10 py-4 rounded-xl font-semibold text-lg shadow-xl"
            style={{
              background: "linear-gradient(135deg, #8DB596, #7EA8BE)",
              color: "white",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartFree}
          >
            Начать бесплатно
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
