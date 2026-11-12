import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft, Plus, X, Trash2, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const periods = [
  { days: 7, label: "Неделя", icon: "🌱" },
  { days: 30, label: "Месяц", icon: "🌿" },
  { days: 90, label: "3 месяца", icon: "🌳" },
];

export function CapsulePage() {
  const { capsules, addCapsule, openCapsule, deleteCapsule, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedDays, setSelectedDays] = useState(7);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const capsuleTextareaRef = useRef<HTMLTextAreaElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const readyToOpen = useMemo(() =>
    capsules.filter((c) => !c.opened && c.openDate <= today),
    [capsules, today]
  );
  const waiting = useMemo(() =>
    capsules.filter((c) => !c.opened && c.openDate > today),
    [capsules, today]
  );
  const opened = useMemo(() =>
    capsules.filter((c) => c.opened).sort((a, b) => (b.openedAt || "").localeCompare(a.openedAt || "")),
    [capsules]
  );

  const handleCreate = () => {
    if (!message.trim()) return;
    addCapsule(message.trim(), selectedDays);
    setMessage("");
    setSelectedDays(7);
    setShowForm(false);
  };

  const handleOpen = (id: string) => {
    openCapsule(id);
    setRevealedId(id);
  };

  const daysUntil = (date: string) => {
    const d = new Date(date + "T12:00:00");
    const n = new Date(today + "T12:00:00");
    return Math.max(0, Math.ceil((d.getTime() - n.getTime()) / 86400000));
  };

  // Delayed autoFocus for modal textarea
  useEffect(() => {
    if (showForm) {
      const timer = setTimeout(() => capsuleTextareaRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [showForm]);

  return (
    <div className="px-5 pt-14 pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>Капсула времени</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Письмо будущему себе</p>
        </div>
        <button onClick={() => setShowForm(true)} className="p-2 rounded-xl" style={{ backgroundColor: t.lavender + "18" }}>
          <Plus className="w-5 h-5" style={{ color: t.lavender }} />
        </button>
      </div>

      {/* Ready to open! */}
      {readyToOpen.length > 0 && (
        <>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>
            Пора открывать!
          </h2>
          <div className="space-y-3 mb-5">
            {readyToOpen.map((cap) => (
              <GlassPanel key={cap.id} darkMode={darkMode} color={t.gold} className="rounded-2xl p-4 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <span style={{ fontSize: "2.5rem" }}>📦</span>
                </motion.div>
                <p style={{ fontSize: "0.78rem", color: t.textMuted, marginTop: 8 }}>
                  Капсула от {new Date(cap.createdAt).toLocaleDateString("ru")}
                </p>
                <motion.button className="mt-3 px-6 py-2.5 rounded-xl font-semibold"
                  style={{ backgroundColor: t.gold + "20", color: t.gold, fontSize: "0.85rem" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpen(cap.id)}>
                  <Unlock className="w-4 h-4 inline mr-1" /> Открыть капсулу
                </motion.button>
                </motion.div>
              </GlassPanel>
            ))}
          </div>
        </>
      )}

      {/* Waiting capsules */}
      {waiting.length > 0 && (
        <>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Ожидают</h2>
          <div className="space-y-2 mb-5">
            {waiting.map((cap) => {
              const days = daysUntil(cap.openDate);
              return (
                <GlassPanel key={cap.id} darkMode={darkMode} color={t.lavender} className="rounded-xl p-4">
                  <motion.div className="flex items-center gap-3"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.bgSecondary }}>
                      <Lock className="w-5 h-5" style={{ color: t.textFaint }} />
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text }}>
                        Закопана {new Date(cap.createdAt).toLocaleDateString("ru")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ fontSize: "0.65rem", color: t.lavender, fontWeight: 600 }}>
                          Ещё {days} {days === 1 ? "день" : days >= 2 && days <= 4 ? "дня" : "дней"}
                        </span>
                        <div className="flex-1 rounded-full h-1" style={{ backgroundColor: t.border }}>
                          <motion.div className="h-1 rounded-full" style={{ backgroundColor: t.lavender }}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.max(5, ((selectedDays - days) / selectedDays) * 100)}%`
                            }} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteCapsule(cap.id)} className="p-1.5">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                    </button>
                  </motion.div>
                </GlassPanel>
              );
            })}
          </div>
        </>
      )}

      {/* Opened capsules */}
      {opened.length > 0 && (
        <>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Открытые</h2>
          <div className="space-y-2 mb-5">
            {opened.map((cap) => (
              <GlassPanel key={cap.id} darkMode={darkMode} color={t.dustyBlue} className="rounded-xl p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: "0.8rem" }}>💌</span>
                  <span style={{ fontSize: "0.65rem", color: t.textFaint }}>
                    Написано {new Date(cap.createdAt).toLocaleDateString("ru")} · Открыто {cap.openedAt ? new Date(cap.openedAt).toLocaleDateString("ru") : ""}
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: t.text, lineHeight: 1.6, fontStyle: "italic" }}>
                  "{cap.message}"
                </p>
                </motion.div>
              </GlassPanel>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {capsules.length === 0 && (
        <GlassPanel darkMode={darkMode} color={t.lavender} className="rounded-2xl p-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span style={{ fontSize: "3rem" }}>📦</span>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text, marginTop: 12 }}>Капсула времени</h2>
          <p style={{ fontSize: "0.8rem", color: t.textMuted, marginTop: 8, lineHeight: 1.6 }}>
            Напишите письмо будущему себе. Через неделю, месяц или 3 месяца оно откроется — как сюрприз от прошлого.
          </p>
          <motion.button className="mt-5 px-6 py-3 rounded-xl font-semibold"
            style={{ backgroundColor: t.lavender, color: "#fff", fontSize: "0.9rem" }}
            whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)}>
            Написать письмо
          </motion.button>
          </motion.div>
        </GlassPanel>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}>
            <motion.div className="w-full max-w-[430px] rounded-t-3xl p-6"
              style={{ backgroundColor: t.card }}
              initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>Письмо будущему себе</h3>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: t.textFaint }} /></button>
              </div>

              <textarea className="w-full rounded-xl px-4 py-3 mb-4 outline-none resize-none"
                ref={capsuleTextareaRef}
                style={{ backgroundColor: t.bgSecondary, color: t.text, fontSize: "0.85rem", border: `1px solid ${t.border}` }}
                rows={5}
                placeholder="Дорогой(ая) будущий(ая) я...
Что бы ты хотел(а) помнить?
За что ты благодарен(на) сейчас?
Что ты хочешь пожелать себе?"
                value={message} onChange={(e) => setMessage(e.target.value)} />

              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Открыть через</p>
              <div className="flex gap-3 mb-5">
                {periods.map((p) => (
                  <button key={p.days}
                    className="flex-1 rounded-xl py-3 text-center"
                    style={{
                      backgroundColor: selectedDays === p.days ? t.lavender + "20" : t.bgSecondary,
                      border: `1.5px solid ${selectedDays === p.days ? t.lavender + "40" : t.border}`,
                    }}
                    onClick={() => setSelectedDays(p.days)}>
                    <span style={{ fontSize: "1.2rem", display: "block" }}><AppIcon icon={p.icon} size={20} /></span>
                    <span style={{ fontSize: "0.72rem", fontWeight: selectedDays === p.days ? 600 : 400, color: selectedDays === p.days ? t.lavender : t.textMuted }}>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>

              <button className="w-full rounded-xl py-3 font-semibold"
                style={{ backgroundColor: t.lavender, color: "#fff", fontSize: "0.9rem", opacity: message.trim() ? 1 : 0.5 }}
                onClick={handleCreate} disabled={!message.trim()}>
                Закопать капсулу
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal animation */}
      <AnimatePresence>
        {revealedId && (() => {
          const cap = capsules.find((c) => c.id === revealedId);
          if (!cap) return null;
          return (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRevealedId(null)}>
              <motion.div className="rounded-3xl p-8 text-center mx-6"
                style={{ backgroundColor: t.card, maxWidth: 360 }}
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                onClick={(e) => e.stopPropagation()}>
                <motion.span style={{ fontSize: "3rem", display: "block" }}
                  initial={{ y: -20 }} animate={{ y: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}>
                  💌
                </motion.span>
                <p style={{ fontSize: "0.7rem", color: t.textFaint, marginTop: 8 }}>
                  Написано {new Date(cap.createdAt).toLocaleDateString("ru")}
                </p>
                <motion.p style={{ fontSize: "1rem", fontWeight: 500, color: t.text, marginTop: 16, lineHeight: 1.7, fontStyle: "italic" }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  "{cap.message}"
                </motion.p>
                <motion.button className="mt-6 px-6 py-2.5 rounded-xl"
                  style={{ backgroundColor: t.lavender + "20", color: t.lavender, fontSize: "0.85rem", fontWeight: 600 }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                  onClick={() => setRevealedId(null)}>
                  Спасибо, прошлый я
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}