import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft, Plus, Wind, Hand, X, TrendingDown, TrendingUp, Minus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";

const triggerSuggestions = [
  "Работа", "Дедлайн", "Конфликт", "Неизвестность",
  "Здоровье", "Финансы", "Отношения", "Сон",
  "Перегрузка", "Одиночество", "Новости", "Транспорт",
];

const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function getLevelColor(level: number): string {
  if (level <= 2) return "#8DB596";
  if (level <= 4) return "#C4A86C";
  if (level <= 6) return "#C4876C";
  if (level <= 8) return "#B8696C";
  return "#9B5A5E";
}

function getLevelLabel(level: number): string {
  if (level <= 2) return "Спокойно";
  if (level <= 4) return "Небольшое беспокойство";
  if (level <= 6) return "Заметная тревога";
  if (level <= 8) return "Сильная тревога";
  return "Очень высокая тревога";
}

function getLevelEmoji(level: number): string {
  if (level <= 2) return "🌿";
  if (level <= 4) return "🌤️";
  if (level <= 6) return "🌥️";
  if (level <= 8) return "🌧️";
  return "⛈️";
}

export function AnxietyPage() {
  const { anxietyEntries, addAnxietyEntry, deleteAnxietyEntry, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [level, setLevel] = useState(5);
  const [trigger, setTrigger] = useState("");
  const [notes, setNotes] = useState("");
  const [showBreathingSuggestion, setShowBreathingSuggestion] = useState(false);
  const [usedBreathing, setUsedBreathing] = useState(false);
  const [usedGrounding, setUsedGrounding] = useState(false);

  // Patterns analysis
  const patterns = useMemo(() => {
    if (anxietyEntries.length < 3) return null;

    // Day of week analysis
    const dayAvg: Record<number, { sum: number; count: number }> = {};
    for (let i = 0; i < 7; i++) dayAvg[i] = { sum: 0, count: 0 };

    anxietyEntries.forEach((e) => {
      const dow = new Date(e.date + "T12:00:00").getDay();
      dayAvg[dow].sum += e.level;
      dayAvg[dow].count += 1;
    });

    const dayAverages = Object.entries(dayAvg)
      .filter(([, v]) => v.count > 0)
      .map(([k, v]) => ({ day: parseInt(k), avg: v.sum / v.count, count: v.count }));

    const worstDay = dayAverages.length > 0
      ? dayAverages.reduce((a, b) => a.avg > b.avg ? a : b)
      : null;
    const bestDay = dayAverages.length > 0
      ? dayAverages.reduce((a, b) => a.avg < b.avg ? a : b)
      : null;

    // Trigger frequency
    const triggerFreq: Record<string, number> = {};
    anxietyEntries.forEach((e) => {
      if (e.trigger) triggerFreq[e.trigger] = (triggerFreq[e.trigger] || 0) + 1;
    });
    const topTriggers = Object.entries(triggerFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Average level
    const avgLevel = anxietyEntries.reduce((s, e) => s + e.level, 0) / anxietyEntries.length;

    // Trend (last 7 vs previous)
    const sorted = [...anxietyEntries].sort((a, b) => b.date.localeCompare(a.date));
    const recent = sorted.slice(0, Math.min(7, sorted.length));
    const older = sorted.slice(Math.min(7, sorted.length), Math.min(14, sorted.length));
    const recentAvg = recent.reduce((s, e) => s + e.level, 0) / (recent.length || 1);
    const olderAvg = older.length > 0 ? older.reduce((s, e) => s + e.level, 0) / older.length : recentAvg;
    const trend = recentAvg - olderAvg;

    // How often breathing/grounding was used
    const breathingUsed = anxietyEntries.filter((e) => e.usedBreathing).length;
    const groundingUsed = anxietyEntries.filter((e) => e.usedGrounding).length;

    return { worstDay, bestDay, topTriggers, avgLevel, trend, breathingUsed, groundingUsed, dayAverages };
  }, [anxietyEntries]);

  const handleSave = () => {
    addAnxietyEntry(level, trigger.trim(), notes.trim() || undefined, usedBreathing, usedGrounding);
    setShowForm(false);
    setLevel(5);
    setTrigger("");
    setNotes("");
    setUsedBreathing(false);
    setUsedGrounding(false);
    setShowBreathingSuggestion(false);
  };

  // When level is high, suggest breathing
  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
    if (newLevel >= 6 && !showBreathingSuggestion) {
      setShowBreathingSuggestion(true);
    }
  };

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
        <div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: t.text }}>
            Трекер тревоги
          </h1>
          <p style={{ fontSize: "0.72rem", color: t.textMuted }}>
            Отслеживайте тревогу — это первый шаг к управлению ей
          </p>
        </div>
      </motion.div>

      {/* New entry button */}
      <motion.button
        className="w-full rounded-2xl p-4 mb-5 flex items-center gap-3"
        style={{
          backgroundColor: darkMode ? "rgba(36,34,32,0.5)" : "rgba(255,255,255,0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)"}`,
          boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
        }}
        onClick={() => setShowForm(true)}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: t.lavender + "15" }}
        >
          <Plus className="w-5 h-5" style={{ color: t.lavender }} />
        </div>
        <div className="flex-1 text-left">
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>
            Как вы себя чувствуете сейчас?
          </span>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>
            Оцените уровень тревоги и запишите триггер
          </p>
        </div>
      </motion.button>

      {/* Patterns insights */}
      {patterns && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassPanel darkMode={darkMode} color={t.lavender} className="rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <span style={{ fontSize: "1rem" }}>🔍</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Ваши паттерны</span>
            </div>

            {/* Avg level */}
            <div className="flex items-center justify-between mb-3 p-3 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: t.textMuted }}>Средний уровень</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: getLevelColor(Math.round(patterns.avgLevel)) }}>
                    {patterns.avgLevel.toFixed(1)}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: t.textMuted }}>/ 10</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {patterns.trend < -0.5 ? (
                  <><TrendingDown className="w-4 h-4" style={{ color: "#8DB596" }} /><span style={{ fontSize: "0.7rem", color: "#8DB596" }}>Снижается</span></>
                ) : patterns.trend > 0.5 ? (
                  <><TrendingUp className="w-4 h-4" style={{ color: "#C4876C" }} /><span style={{ fontSize: "0.7rem", color: "#C4876C" }}>Растёт</span></>
                ) : (
                  <><Minus className="w-4 h-4" style={{ color: t.textMuted }} /><span style={{ fontSize: "0.7rem", color: t.textMuted }}>Стабильно</span></>
                )}
              </div>
            </div>

            {/* Day of week bars */}
            {patterns.dayAverages.length >= 2 && (
              <div className="mb-3">
                <span style={{ fontSize: "0.72rem", fontWeight: 500, color: t.textMuted, marginBottom: 6, display: "block" }}>
                  По дням недели
                </span>
                <div className="flex items-end gap-1 h-16">
                  {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                    const da = patterns.dayAverages.find((d) => d.day === dayIdx);
                    const avg = da ? da.avg : 0;
                    const height = avg > 0 ? Math.max(8, (avg / 10) * 100) : 4;
                    const isWorst = patterns.worstDay?.day === dayIdx && da && da.count > 0;
                    return (
                      <div key={dayIdx} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                          className="w-full rounded-t"
                          style={{
                            transformOrigin: "bottom",
                            height: `${height}%`,
                            backgroundColor: isWorst
                              ? getLevelColor(Math.round(avg))
                              : avg > 0 ? t.lavender + "40" : t.border + "40",
                            minHeight: 3,
                          }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 0.2 + dayIdx * 0.05 }}
                        />
                        <span style={{ fontSize: "0.55rem", color: isWorst ? getLevelColor(Math.round(avg)) : t.textFaint }}>
                          {dayNames[dayIdx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {patterns.worstDay && patterns.worstDay.count > 0 && (
                  <p style={{ fontSize: "0.68rem", color: t.textMuted, marginTop: 6 }}>
                    Тревога обычно выше по {dayNames[patterns.worstDay.day]}м ({patterns.worstDay.avg.toFixed(1)}/10)
                    {patterns.bestDay && patterns.bestDay.day !== patterns.worstDay.day &&
                      `, спокойнее — по ${dayNames[patterns.bestDay.day]}м (${patterns.bestDay.avg.toFixed(1)}/10)`}
                  </p>
                )}
              </div>
            )}

            {/* Top triggers */}
            {patterns.topTriggers.length > 0 && (
              <div className="mb-2">
                <span style={{ fontSize: "0.72rem", fontWeight: 500, color: t.textMuted, marginBottom: 6, display: "block" }}>
                  Частые триггеры
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {patterns.topTriggers.map(([trig, count]) => (
                    <span
                      key={trig}
                      className="px-2.5 py-1 rounded-full"
                      style={{ fontSize: "0.7rem", backgroundColor: t.lavender + "12", color: t.lavender, fontWeight: 500 }}
                    >
                      {trig} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Breathing/grounding usage */}
            {(patterns.breathingUsed > 0 || patterns.groundingUsed > 0) && (
              <div className="mt-3 p-2.5 rounded-xl" style={{ backgroundColor: t.sage + "08" }}>
                <p style={{ fontSize: "0.7rem", color: t.sage }}>
                  Вы использовали дыхание {patterns.breathingUsed}x и заземление {patterns.groundingUsed}x — это настоящая забота о себе
                </p>
              </div>
            )}
          </GlassPanel>
        </motion.div>
      )}

      {/* Quick tools */}
      <motion.div
        className="grid grid-cols-2 gap-2.5 mb-5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <button
          className="rounded-xl p-3.5 flex items-center gap-2.5"
          style={{
            backgroundColor: darkMode ? "rgba(36,34,32,0.5)" : "rgba(255,255,255,0.5)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)"}`,
          }}
          onClick={() => navigate("/app/anxiety/grounding")}
        >
          <Hand className="w-5 h-5" style={{ color: t.teal }} />
          <div className="text-left">
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, display: "block" }}>5-4-3-2-1</span>
            <span style={{ fontSize: "0.62rem", color: t.textMuted }}>Заземление</span>
          </div>
        </button>
        <button
          className="rounded-xl p-3.5 flex items-center gap-2.5"
          style={{
            backgroundColor: darkMode ? "rgba(36,34,32,0.5)" : "rgba(255,255,255,0.5)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)"}`,
          }}
          onClick={() => {
            // Open breathing widget via dispatch
            document.dispatchEvent(new CustomEvent("open-breathing"));
          }}
        >
          <Wind className="w-5 h-5" style={{ color: t.dustyBlue }} />
          <div className="text-left">
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, display: "block" }}>Дыхание</span>
            <span style={{ fontSize: "0.62rem", color: t.textMuted }}>Практика</span>
          </div>
        </button>
      </motion.div>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: t.text, marginBottom: 12 }}>
          История
        </h3>
        {anxietyEntries.length === 0 && (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: t.bgSecondary }}>
            <span style={{ fontSize: "1.5rem", display: "block", marginBottom: 8 }}>🫧</span>
            <p style={{ fontSize: "0.82rem", color: t.textMuted }}>
              Здесь будут ваши записи
            </p>
            <p style={{ fontSize: "0.7rem", color: t.textFaint, marginTop: 4 }}>
              Отслеживание тревоги помогает лучше понять себя
            </p>
          </div>
        )}
        <div className="space-y-2.5">
          {anxietyEntries.slice(0, 20).map((entry, i) => (
            <motion.div
              key={entry.id}
              className="rounded-xl p-3.5 border"
              style={{ backgroundColor: t.bgSecondary, borderColor: t.border }}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.03 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "0.9rem" }}>{getLevelEmoji(entry.level)}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: getLevelColor(entry.level) }}>
                    {entry.level}/10
                  </span>
                  <span style={{ fontSize: "0.68rem", color: t.textFaint }}>
                    {getLevelLabel(entry.level)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "0.65rem", color: t.textFaint }}>
                    {entry.date} {entry.time}
                  </span>
                  <button onClick={() => deleteAnxietyEntry(entry.id)}>
                    <Trash2 className="w-3.5 h-3.5" style={{ color: t.textFaint }} />
                  </button>
                </div>
              </div>
              {entry.trigger && (
                <span
                  className="inline-block px-2 py-0.5 rounded-full mb-1"
                  style={{ fontSize: "0.68rem", backgroundColor: t.lavender + "12", color: t.lavender }}
                >
                  {entry.trigger}
                </span>
              )}
              {entry.notes && (
                <p style={{ fontSize: "0.72rem", color: t.textMuted, marginTop: 2 }}>{entry.notes}</p>
              )}
              {(entry.usedBreathing || entry.usedGrounding) && (
                <div className="flex gap-2 mt-1.5">
                  {entry.usedBreathing && (
                    <span style={{ fontSize: "0.62rem", color: t.sage }}>🌬️ Дыхание</span>
                  )}
                  {entry.usedGrounding && (
                    <span style={{ fontSize: "0.62rem", color: t.teal }}>🖐️ Заземление</span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Add entry modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: t.overlay }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="w-full max-w-[430px] rounded-t-3xl p-6 shadow-xl max-h-[85vh] overflow-y-auto"
              style={{ backgroundColor: t.bg }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: t.text }}>
                  Отметить тревогу
                </h3>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: t.border }}
                  onClick={() => setShowForm(false)}
                >
                  <X className="w-4 h-4" style={{ color: t.textMuted }} />
                </button>
              </div>

              {/* Level slider */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>
                    Уровень тревоги
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: "0.9rem" }}>{getLevelEmoji(level)}</span>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: getLevelColor(level) }}>{level}</span>
                    <span style={{ fontSize: "0.72rem", color: t.textMuted }}>/10</span>
                  </div>
                </div>

                <p style={{ fontSize: "0.72rem", color: getLevelColor(level), fontWeight: 500, marginBottom: 8 }}>
                  {getLevelLabel(level)}
                </p>

                {/* Custom slider */}
                <div className="relative">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={level}
                    onChange={(e) => handleLevelChange(parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none outline-none"
                    style={{
                      background: `linear-gradient(to right, #8DB596 0%, #C4A86C 30%, #C4876C 60%, #9B5A5E 100%)`,
                      accentColor: getLevelColor(level),
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span style={{ fontSize: "0.6rem", color: t.textFaint }}>Спокойно</span>
                    <span style={{ fontSize: "0.6rem", color: t.textFaint }}>Паника</span>
                  </div>
                </div>
              </div>

              {/* Breathing suggestion for high levels */}
              <AnimatePresence>
                {showBreathingSuggestion && level >= 6 && (
                  <motion.div
                    className="rounded-xl p-3.5 mb-4 border"
                    style={{ backgroundColor: t.dustyBlue + "08", borderColor: t.dustyBlue + "20" }}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p style={{ fontSize: "0.78rem", color: t.text, fontWeight: 500, marginBottom: 6 }}>
                      💙 Тревога высокая. Может, попробуем дыхание?
                    </p>
                    <p style={{ fontSize: "0.7rem", color: t.textMuted, marginBottom: 8 }}>
                      Даже 1 минута глубокого дыхания активирует парасимпатическую нервную систему
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2 rounded-xl text-center"
                        style={{ fontSize: "0.75rem", fontWeight: 500, backgroundColor: t.dustyBlue + "15", color: t.dustyBlue }}
                        onClick={() => {
                          setUsedBreathing(true);
                          document.dispatchEvent(new CustomEvent("open-breathing"));
                        }}
                      >
                        <Wind className="w-3.5 h-3.5 inline mr-1" />
                        Дыхание
                      </button>
                      <button
                        className="flex-1 py-2 rounded-xl text-center"
                        style={{ fontSize: "0.75rem", fontWeight: 500, backgroundColor: t.teal + "15", color: t.teal }}
                        onClick={() => {
                          setUsedGrounding(true);
                          setShowForm(false);
                          navigate("/app/anxiety/grounding");
                        }}
                      >
                        <Hand className="w-3.5 h-3.5 inline mr-1" />
                        5-4-3-2-1
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trigger */}
              <div className="mb-4">
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, display: "block", marginBottom: 8 }}>
                  Что вызвало тревогу?
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {triggerSuggestions.map((s) => (
                    <button
                      key={s}
                      className="px-2.5 py-1 rounded-full border"
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        borderColor: trigger === s ? t.lavender + "50" : t.border,
                        backgroundColor: trigger === s ? t.lavender + "12" : "transparent",
                        color: trigger === s ? t.lavender : t.textMuted,
                      }}
                      onClick={() => setTrigger(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="Или введите своё..."
                  className="w-full rounded-xl px-3 py-2.5 border outline-none"
                  style={{ fontSize: "0.8rem", backgroundColor: t.inputBg, borderColor: t.border, color: t.text }}
                />
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, display: "block", marginBottom: 6 }}>
                  Заметки (необязательно)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Что вы чувствуете, о чём думаете..."
                  rows={3}
                  className="w-full rounded-xl px-3 py-2.5 border outline-none resize-none"
                  style={{ fontSize: "0.8rem", backgroundColor: t.inputBg, borderColor: t.border, color: t.text }}
                />
              </div>

              {/* Used tools checkboxes */}
              <div className="flex gap-3 mb-5">
                <button
                  className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5"
                  style={{
                    borderColor: usedBreathing ? t.dustyBlue + "40" : t.border,
                    backgroundColor: usedBreathing ? t.dustyBlue + "10" : "transparent",
                  }}
                  onClick={() => setUsedBreathing(!usedBreathing)}
                >
                  <Wind className="w-3.5 h-3.5" style={{ color: usedBreathing ? t.dustyBlue : t.textFaint }} />
                  <span style={{ fontSize: "0.7rem", fontWeight: 500, color: usedBreathing ? t.dustyBlue : t.textMuted }}>
                    Дыхание
                  </span>
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5"
                  style={{
                    borderColor: usedGrounding ? t.teal + "40" : t.border,
                    backgroundColor: usedGrounding ? t.teal + "10" : "transparent",
                  }}
                  onClick={() => setUsedGrounding(!usedGrounding)}
                >
                  <Hand className="w-3.5 h-3.5" style={{ color: usedGrounding ? t.teal : t.textFaint }} />
                  <span style={{ fontSize: "0.7rem", fontWeight: 500, color: usedGrounding ? t.teal : t.textMuted }}>
                    Заземление
                  </span>
                </button>
              </div>

              {/* Save */}
              <motion.button
                className="w-full text-white rounded-2xl py-3.5 shadow-md"
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${t.lavender}, ${t.dustyBlue})`,
                }}
                onClick={handleSave}
                whileTap={{ scale: 0.98 }}
              >
                Сохранить
              </motion.button>

              <p style={{ fontSize: "0.65rem", color: t.textFaint, textAlign: "center", marginTop: 8 }}>
                +8 XP за осознанность
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}