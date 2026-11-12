import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft, Phone, Plus, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const quickTools = [
  { id: "breathing", label: "Дыхание", icon: "🌬️", color: "#7EA8BE", desc: "4-7-8 дыхание", route: null },
  { id: "grounding", label: "Заземление", icon: "🖐️", color: "#8DB596", desc: "5-4-3-2-1", route: "/app/anxiety/grounding" },
  { id: "affirmation", label: "Аффирмация", icon: "💜", color: "#9B8EC4", desc: "Тёплые слова", route: null },
  { id: "drink", label: "Тёплый напиток", icon: "☕", color: "#C4876C", desc: "Согреть руки", route: null },
  { id: "music", label: "Тишина", icon: "🎵", color: "#C4A86C", desc: "2 мин в тишине", route: null },
  { id: "walk", label: "5 шагов", icon: "🚶", color: "#7BAFB0", desc: "Встать и пройтись", route: null },
];

const affirmations = [
  "Это пройдёт. Всё проходит.",
  "Ты в безопасности прямо сейчас.",
  "Ты справлялся раньше — справишься и сейчас.",
  "Дыши. Ты живой. Этого достаточно.",
  "Тревога — это не ты. Она гость, и она уйдёт.",
  "Ты сильнее, чем думаешь.",
  "Прямо сейчас всё в порядке.",
  "Это чувство временно.",
  "Ты заслуживаешь покоя.",
  "Одна минута за раз.",
];

// Breathing exercise inline
function BreathingExercise({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);

  useState(() => {
    let timer: ReturnType<typeof setInterval>;
    const runCycle = () => {
      let step = 0;
      timer = setInterval(() => {
        step++;
        if (step <= 4) { setPhase("inhale"); setCount(4 - step + 1); }
        else if (step <= 11) { setPhase("hold"); setCount(11 - step + 1); }
        else if (step <= 19) { setPhase("exhale"); setCount(19 - step + 1); }
        else { step = 0; setCycles((c) => c + 1); }
      }, 1000);
    };
    runCycle();
    return () => clearInterval(timer);
  });

  const phaseLabel = phase === "inhale" ? "Вдох" : phase === "hold" ? "Задержка" : "Выдох";
  const phaseColor = phase === "inhale" ? "#7EA8BE" : phase === "hold" ? "#9B8EC4" : "#8DB596";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="rounded-3xl p-8 text-center"
        style={{ backgroundColor: t.card, width: 300 }}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8 }} animate={{ scale: 1 }}
      >
        <motion.div
          className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ border: `3px solid ${phaseColor}` }}
          animate={{
            scale: phase === "inhale" ? [1, 1.3] : phase === "hold" ? 1.3 : [1.3, 1],
          }}
          transition={{ duration: phase === "inhale" ? 4 : phase === "hold" ? 7 : 8, ease: "easeInOut" }}
        >
          <div className="text-center">
            <div style={{ fontSize: "2rem", fontWeight: 700, color: phaseColor }}>{count}</div>
            <div style={{ fontSize: "0.8rem", color: t.textMuted }}>{phaseLabel}</div>
          </div>
        </motion.div>
        <p style={{ fontSize: "0.8rem", color: t.textFaint }}>Цикл {cycles + 1}</p>
        <button
          className="mt-4 px-6 py-2 rounded-xl"
          style={{ backgroundColor: t.bgSecondary, color: t.text, fontSize: "0.85rem" }}
          onClick={onClose}
        >
          Закрыть
        </button>
      </motion.div>
    </motion.div>
  );
}

export function SOSPage() {
  const { sosSettings, updateSOSSettings, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const [showBreathing, setShowBreathing] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [currentAffirmation, setCurrentAffirmation] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const handleToolPress = (toolId: string, route: string | null) => {
    if (toolId === "breathing") {
      setShowBreathing(true);
    } else if (toolId === "grounding" && route) {
      navigate(route);
    } else if (toolId === "affirmation") {
      setCurrentAffirmation(affirmations[Math.floor(Math.random() * affirmations.length)]);
      setShowAffirmation(true);
    } else {
      // Show a gentle reminder for non-interactive tools
      setCurrentAffirmation(
        toolId === "drink" ? "Заварите себе что-нибудь тёплое. Подержите кружку в руках. Почувствуйте тепло." :
        toolId === "music" ? "Закройте глаза. Послушайте тишину 2 минуты. Просто дышите." :
        "Встаньте. Сделайте 5 медленных шагов. Почувствуйте стопы на полу."
      );
      setShowAffirmation(true);
    }
  };

  const addContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) return;
    updateSOSSettings({
      contacts: [...sosSettings.contacts, { name: contactName.trim(), phone: contactPhone.trim() }],
    });
    setContactName("");
    setContactPhone("");
    setShowAddContact(false);
  };

  const removeContact = (idx: number) => {
    const updated = sosSettings.contacts.filter((_, i) => i !== idx);
    updateSOSSettings({ contacts: updated });
  };

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>SOS</h1>
          <p style={{ fontSize: "0.72rem", color: t.textMuted }}>Мгновенная помощь при тревоге</p>
        </div>
      </div>

      {/* Calming message */}
      <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-5 mb-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
        <span style={{ fontSize: "2rem" }}>🫂</span>
        <p style={{ fontSize: "0.95rem", fontWeight: 600, color: t.text, marginTop: 8 }}>
          Ты в безопасности
        </p>
        <p style={{ fontSize: "0.78rem", color: t.textMuted, marginTop: 4, lineHeight: 1.5 }}>
          Прямо сейчас всё в порядке. Давай вместе успокоимся.
        </p>
        </motion.div>
      </GlassPanel>

      {/* Quick tools grid */}
      <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: 10 }}>
        Быстрые инструменты
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {quickTools.map((tool, i) => (
          <GlassPanel key={tool.id} darkMode={darkMode} color={tool.color} className="rounded-2xl">
            <motion.button
              className="w-full p-4 text-left"
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => handleToolPress(tool.id, tool.route)}
            >
              <AppIcon icon={tool.icon} size={24} color={tool.color} />
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginTop: 6 }}>{tool.label}</p>
              <p style={{ fontSize: "0.68rem", color: t.textMuted }}>{tool.desc}</p>
            </motion.button>
          </GlassPanel>
        ))}
      </div>

      {/* Emergency contacts */}
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>
          Близкие люди
        </h2>
        <button onClick={() => setShowAddContact(true)} className="p-1.5 rounded-lg" style={{ backgroundColor: t.bgSecondary }}>
          <Plus className="w-4 h-4" style={{ color: t.sage }} />
        </button>
      </div>

      {sosSettings.contacts.length === 0 ? (
        <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-4 text-center mb-5">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
          <Phone className="w-6 h-6 mx-auto mb-2" style={{ color: t.textFaint }} />
          <p style={{ fontSize: "0.78rem", color: t.textMuted }}>
            Добавьте контакт близкого человека, которому можно позвонить
          </p>
          </motion.div>
        </GlassPanel>
      ) : (
        <div className="space-y-2 mb-5">
          {sosSettings.contacts.map((contact, idx) => (
            <GlassPanel key={idx} darkMode={darkMode} color="#8DB596" className="rounded-xl p-3">
              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8DB59618" }}>
                    <span style={{ fontSize: "1rem" }}>💚</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>{contact.name}</p>
                    <p style={{ fontSize: "0.7rem", color: t.textMuted }}>{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${contact.phone}`} className="p-2 rounded-lg" style={{ backgroundColor: "#8DB59618" }}>
                    <Phone className="w-4 h-4" style={{ color: "#8DB596" }} />
                  </a>
                  <button onClick={() => removeContact(idx)} className="p-2 rounded-lg" style={{ backgroundColor: t.bgSecondary }}>
                    <Trash2 className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                  </button>
                </div>
              </motion.div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Safety reminder */}
      <GlassPanel darkMode={darkMode} color="#C4876C" className="rounded-2xl p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#C4876C", marginBottom: 4 }}>
          Если вам нужна профессиональная помощь
        </p>
        <p style={{ fontSize: "0.7rem", color: t.textMuted, lineHeight: 1.5 }}>
          Телефон доверия: 8-800-2000-122 (бесплатно, круглосуточно).
          Это приложение не заменяет профессиональную помощь.
        </p>
        </motion.div>
      </GlassPanel>

      {/* Add contact modal */}
      <AnimatePresence>
        {showAddContact && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddContact(false)}>
            <motion.div className="w-full max-w-[430px] rounded-t-3xl p-6"
              style={{ backgroundColor: t.card }}
              initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>Добавить контакт</h3>
                <button onClick={() => setShowAddContact(false)}><X className="w-5 h-5" style={{ color: t.textFaint }} /></button>
              </div>
              <input className="w-full rounded-xl px-4 py-3 mb-3 outline-none" placeholder="Имя"
                style={{ backgroundColor: t.bgSecondary, color: t.text, border: `1px solid ${t.border}`, fontSize: "0.85rem" }}
                value={contactName} onChange={(e) => setContactName(e.target.value)} />
              <input className="w-full rounded-xl px-4 py-3 mb-4 outline-none" placeholder="Телефон"
                style={{ backgroundColor: t.bgSecondary, color: t.text, border: `1px solid ${t.border}`, fontSize: "0.85rem" }}
                value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} type="tel" />
              <button className="w-full rounded-xl py-3 font-semibold"
                style={{ backgroundColor: t.sage, color: "#fff", fontSize: "0.9rem" }}
                onClick={addContact}>
                Сохранить
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breathing overlay */}
      <AnimatePresence>
        {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}
      </AnimatePresence>

      {/* Affirmation overlay */}
      <AnimatePresence>
        {showAffirmation && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAffirmation(false)}>
            <motion.div className="rounded-3xl p-8 text-center mx-4"
              style={{ backgroundColor: t.card, maxWidth: 340 }}
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}>
              <span style={{ fontSize: "2.5rem" }}>💜</span>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, color: t.text, marginTop: 16, lineHeight: 1.6 }}>
                {currentAffirmation}
              </p>
              <button className="mt-6 px-6 py-2.5 rounded-xl"
                style={{ backgroundColor: t.lavender + "20", color: t.lavender, fontSize: "0.85rem", fontWeight: 600 }}
                onClick={() => {
                  setCurrentAffirmation(affirmations[Math.floor(Math.random() * affirmations.length)]);
                }}>
                Ещё одну
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}