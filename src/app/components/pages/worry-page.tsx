import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft, Plus, X, Check, XCircle, Trash2, TrendingDown, Clock, Eye } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const categories = [
  { id: "health", label: "Здоровье", icon: "🏥" },
  { id: "work", label: "Работа", icon: "💼" },
  { id: "money", label: "Финансы", icon: "💰" },
  { id: "relations", label: "Отношения", icon: "💕" },
  { id: "future", label: "Будущее", icon: "🔮" },
  { id: "social", label: "Социальное", icon: "👥" },
  { id: "other", label: "Другое", icon: "📌" },
];

const reviewPeriods = [
  { days: 3, label: "3 дня" },
  { days: 7, label: "Неделя" },
  { days: 14, label: "2 недели" },
  { days: 30, label: "Месяц" },
];

export function WorryPage() {
  const { worryEntries, addWorryEntry, reviewWorryEntry, deleteWorryEntry, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"active" | "review" | "done">("active");
  const [worry, setWorry] = useState("");
  const [probability, setProbability] = useState(5);
  const [category, setCategory] = useState("other");
  const [reviewDays, setReviewDays] = useState(7);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const worryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const reviewTextareaRef = useRef<HTMLTextAreaElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const activeWorries = useMemo(() =>
    worryEntries.filter((w) => !w.reviewed && (!w.reviewDate || w.reviewDate > today)),
    [worryEntries, today]
  );

  const readyForReview = useMemo(() =>
    worryEntries.filter((w) => !w.reviewed && w.reviewDate && w.reviewDate <= today),
    [worryEntries, today]
  );

  const reviewed = useMemo(() =>
    worryEntries.filter((w) => w.reviewed),
    [worryEntries]
  );

  // Stats
  const stats = useMemo(() => {
    const total = reviewed.length;
    if (total === 0) return null;
    const happened = reviewed.filter((w) => w.happened).length;
    const notHappened = total - happened;
    const pct = Math.round((notHappened / total) * 100);
    const avgProbability = Math.round(reviewed.reduce((s, w) => s + w.probability, 0) / total);
    return { total, happened, notHappened, pct, avgProbability };
  }, [reviewed]);

  const handleAdd = () => {
    if (!worry.trim()) return;
    addWorryEntry(worry.trim(), probability, category, reviewDays);
    setWorry("");
    setProbability(5);
    setCategory("other");
    setReviewDays(7);
    setShowForm(false);
  };

  const handleReview = (id: string, happened: boolean) => {
    reviewWorryEntry(id, happened, reviewNote);
    setReviewingId(null);
    setReviewNote("");
  };

  const getProbabilityColor = (p: number) => {
    if (p <= 3) return "#8DB596";
    if (p <= 6) return "#C4A86C";
    if (p <= 8) return "#C4876C";
    return "#B8696C";
  };

  const catIcon = (id: string) => categories.find((c) => c.id === id)?.icon || "📌";

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>Дневник тревог</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Запишите беспокойство — вернитесь и проверьте</p>
        </div>
        <button onClick={() => setShowForm(true)} className="p-2 rounded-xl" style={{ backgroundColor: t.sage + "18" }}>
          <Plus className="w-5 h-5" style={{ color: t.sage }} />
        </button>
      </div>

      {/* Stats card */}
      {stats && (
        <GlassPanel darkMode={darkMode} color="#8DB596" className="rounded-2xl p-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8DB59618" }}>
                <TrendingDown className="w-6 h-6" style={{ color: "#8DB596" }} />
              </div>
              <div>
                <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#8DB596" }}>{stats.pct}%</p>
                <p style={{ fontSize: "0.72rem", color: t.textMuted }}>тревог НЕ сбылись</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-2 text-center" style={{ backgroundColor: t.bgSecondary }}>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>{stats.total}</p>
                <p style={{ fontSize: "0.6rem", color: t.textFaint }}>Проверено</p>
              </div>
              <div className="rounded-xl p-2 text-center" style={{ backgroundColor: "#8DB59610" }}>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "#8DB596" }}>{stats.notHappened}</p>
                <p style={{ fontSize: "0.6rem", color: t.textFaint }}>Не сбылось</p>
              </div>
              <div className="rounded-xl p-2 text-center" style={{ backgroundColor: "#C4876C10" }}>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "#C4876C" }}>{stats.happened}</p>
                <p style={{ fontSize: "0.6rem", color: t.textFaint }}>Сбылось</p>
              </div>
            </div>
            <p style={{ fontSize: "0.68rem", color: t.textMuted, marginTop: 8, fontStyle: "italic", textAlign: "center" }}>
              {stats.pct >= 80
                ? `${stats.pct}% ваших тревог не сбылись! Помните об этом, когда волнуетесь.`
                : stats.pct >= 60
                ? `Большинство тревог — ${stats.pct}% — не сбылись. Вы справляетесь лучше, чем думаете.`
                : `Средняя оценка вероятности: ${stats.avgProbability}/10. Продолжайте наблюдать — паттерны станут яснее.`}
            </p>
          </motion.div>
        </GlassPanel>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-xl p-1" style={{ backgroundColor: darkMode ? "rgba(36,34,32,0.6)" : "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)" }}>
        {([
          { id: "active" as const, label: "Активные", count: activeWorries.length },
          { id: "review" as const, label: "Проверить", count: readyForReview.length },
          { id: "done" as const, label: "Проверено", count: reviewed.length },
        ]).map((tb) => (
          <button
            key={tb.id}
            className="flex-1 rounded-lg py-2 px-1 relative"
            style={{
              backgroundColor: tab === tb.id ? t.card : "transparent",
              fontSize: "0.75rem",
              fontWeight: tab === tb.id ? 600 : 400,
              color: tab === tb.id ? t.text : t.textMuted,
            }}
            onClick={() => setTab(tb.id)}
          >
            {tb.label}
            {tb.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full" style={{
                fontSize: "0.6rem", fontWeight: 600,
                backgroundColor: tb.id === "review" ? "#C4876C20" : t.bgSecondary,
                color: tb.id === "review" ? "#C4876C" : t.textFaint,
              }}>
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active worries */}
      {tab === "active" && (
        <div className="space-y-2">
          {activeWorries.length === 0 ? (
            <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-6 text-center">
              <p style={{ fontSize: "1.5rem", marginBottom: 8 }}>🌿</p>
              <p style={{ fontSize: "0.82rem", color: t.textMuted }}>Нет активных тревог</p>
              <p style={{ fontSize: "0.72rem", color: t.textFaint }}>Запишите беспокойство — мы напомним проверить</p>
            </GlassPanel>
          ) : (
            activeWorries.map((w, i) => (
              <GlassPanel key={w.id} darkMode={darkMode} color={getProbabilityColor(w.probability)} className="rounded-xl p-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="flex items-start gap-2">
                    <AppIcon icon={catIcon(w.category)} size={16} color={t.textMuted} />
                    <div className="flex-1">
                      <p style={{ fontSize: "0.82rem", color: t.text, lineHeight: 1.4 }}>{w.worry}</p>
                      <p style={{ fontSize: "0.65rem", color: t.textFaint, marginTop: 4 }}>
                        Записано {new Date(w.date).toLocaleDateString("ru")} · Вероятность: {w.probability}/10
                      </p>
                    </div>
                    <button onClick={() => deleteWorryEntry(w.id)} className="p-1">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                    </button>
                  </div>
                </motion.div>
              </GlassPanel>
            ))
          )}
        </div>
      )}

      {/* Ready for review */}
      {tab === "review" && (
        <div className="space-y-2">
          {readyForReview.length === 0 ? (
            <GlassPanel darkMode={darkMode} color={t.lavender} className="rounded-2xl p-6 text-center">
              <p style={{ fontSize: "1.5rem", marginBottom: 8 }}>⏳</p>
              <p style={{ fontSize: "0.82rem", color: t.textMuted }}>Нет тревог для проверки</p>
              <p style={{ fontSize: "0.72rem", color: t.textFaint }}>Когда срок придёт — они появятся здесь</p>
            </GlassPanel>
          ) : (
            readyForReview.map((w) => (
              <GlassPanel key={w.id} darkMode={darkMode} color={t.lavender} className="rounded-xl p-4">
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-start gap-2 mb-3">
                    <AppIcon icon={catIcon(w.category)} size={16} color={t.textMuted} />
                    <div className="flex-1">
                      <p style={{ fontSize: "0.82rem", color: t.text, lineHeight: 1.4 }}>{w.worry}</p>
                      <p style={{ fontSize: "0.65rem", color: t.textFaint, marginTop: 4 }}>
                        Записано {new Date(w.date).toLocaleDateString("ru")} · Вероятность: {w.probability}/10
                      </p>
                    </div>
                  </div>

                  {reviewingId === w.id ? (
                    <div>
                      <textarea
                        ref={reviewTextareaRef}
                        className="w-full rounded-xl px-3 py-2 mb-3 outline-none resize-none"
                        style={{ backgroundColor: t.bgSecondary, color: t.text, fontSize: "0.8rem", border: `1px solid ${t.border}` }}
                        rows={2}
                        placeholder="Что произошло на самом деле? (необязательно)"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-2 font-semibold"
                          style={{ backgroundColor: "#8DB59618", color: "#8DB596", fontSize: "0.82rem" }}
                          onClick={() => handleReview(w.id, false)}>
                          <XCircle className="w-4 h-4" /> Не сбылось
                        </button>
                        <button className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-2 font-semibold"
                          style={{ backgroundColor: "#C4876C18", color: "#C4876C", fontSize: "0.82rem" }}
                          onClick={() => handleReview(w.id, true)}>
                          <Check className="w-4 h-4" /> Сбылось
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 font-semibold"
                      style={{ backgroundColor: t.lavender + "18", color: t.lavender, fontSize: "0.82rem" }}
                      onClick={() => setReviewingId(w.id)}>
                      <Eye className="w-4 h-4" /> Проверить
                    </button>
                  )}
                </motion.div>
              </GlassPanel>
            ))
          )}
        </div>
      )}

      {/* Reviewed */}
      {tab === "done" && (
        <div className="space-y-2">
          {reviewed.length === 0 ? (
            <GlassPanel darkMode={darkMode} color={t.dustyBlue} className="rounded-2xl p-6 text-center">
              <p style={{ fontSize: "1.5rem", marginBottom: 8 }}>📋</p>
              <p style={{ fontSize: "0.82rem", color: t.textMuted }}>Пока нет проверенных записей</p>
            </GlassPanel>
          ) : (
            reviewed.map((w, i) => (
              <GlassPanel key={w.id} darkMode={darkMode} color={w.happened ? "#C4876C" : "#8DB596"} className="rounded-xl p-3">
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{
                      backgroundColor: w.happened ? "#C4876C18" : "#8DB59618",
                    }}>
                      {w.happened ? <span style={{ fontSize: "0.6rem" }}>!</span> : <Check className="w-3 h-3" style={{ color: "#8DB596" }} />}
                    </span>
                    <div className="flex-1">
                      <p style={{ fontSize: "0.78rem", color: t.text, textDecoration: w.happened ? "none" : "line-through", opacity: w.happened ? 1 : 0.7 }}>
                        {w.worry}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ fontSize: "0.6rem", color: w.happened ? "#C4876C" : "#8DB596", fontWeight: 600 }}>
                          {w.happened ? "Сбылось" : "Не сбылось"}
                        </span>
                        <span style={{ fontSize: "0.6rem", color: t.textFaint }}>
                          Ожидание: {w.probability}/10
                        </span>
                      </div>
                      {w.reviewNote && (
                        <p style={{ fontSize: "0.68rem", color: t.textMuted, marginTop: 4, fontStyle: "italic" }}>
                          {w.reviewNote}
                        </p>
                      )}
                    </div>
                    <button onClick={() => deleteWorryEntry(w.id)} className="p-1">
                      <Trash2 className="w-3 h-3" style={{ color: t.textFaint }} />
                    </button>
                  </div>
                </motion.div>
              </GlassPanel>
            ))
          )}
        </div>
      )}

      {/* Add worry modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}>
            <motion.div className="w-full max-w-[430px] rounded-t-3xl p-6"
              style={{ backgroundColor: t.card, maxHeight: "85vh", overflowY: "auto" }}
              initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>Записать беспокойство</h3>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: t.textFaint }} /></button>
              </div>

              <textarea className="w-full rounded-xl px-4 py-3 mb-3 outline-none resize-none"
                ref={worryTextareaRef}
                style={{ backgroundColor: t.bgSecondary, color: t.text, fontSize: "0.85rem", border: `1px solid ${t.border}` }}
                rows={3}
                placeholder="Что вас беспокоит?"
                value={worry}
                onChange={(e) => setWorry(e.target.value)} />

              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Категория</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((c) => (
                  <button key={c.id}
                    className="px-3 py-1.5 rounded-full flex items-center gap-1"
                    style={{
                      backgroundColor: category === c.id ? t.sage + "20" : t.bgSecondary,
                      border: `1px solid ${category === c.id ? t.sage + "40" : t.border}`,
                      fontSize: "0.75rem",
                      color: category === c.id ? t.sage : t.textMuted,
                      fontWeight: category === c.id ? 600 : 400,
                    }}
                    onClick={() => setCategory(c.id)}>
                    <AppIcon icon={c.icon} size={13} color={category === c.id ? t.sage : t.textMuted} /> {c.label}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>
                Вероятность: <span style={{ color: getProbabilityColor(probability) }}>{probability}/10</span>
              </p>
              <input type="range" min={1} max={10} value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                className="w-full mb-4" style={{ accentColor: getProbabilityColor(probability) }} />

              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Проверить через</p>
              <div className="flex gap-2 mb-5">
                {reviewPeriods.map((rp) => (
                  <button key={rp.days}
                    className="flex-1 rounded-xl py-2 text-center"
                    style={{
                      backgroundColor: reviewDays === rp.days ? t.lavender + "20" : t.bgSecondary,
                      border: `1px solid ${reviewDays === rp.days ? t.lavender + "40" : t.border}`,
                      fontSize: "0.75rem",
                      color: reviewDays === rp.days ? t.lavender : t.textMuted,
                      fontWeight: reviewDays === rp.days ? 600 : 400,
                    }}
                    onClick={() => setReviewDays(rp.days)}>
                    {rp.label}
                  </button>
                ))}
              </div>

              <button className="w-full rounded-xl py-3 font-semibold"
                style={{ backgroundColor: t.sage, color: "#fff", fontSize: "0.9rem", opacity: worry.trim() ? 1 : 0.5 }}
                onClick={handleAdd} disabled={!worry.trim()}>
                Записать
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}