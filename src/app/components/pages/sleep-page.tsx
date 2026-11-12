import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft, Moon, Sun, Star } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const qualityLabels = ["", "😫 Ужасно", "😟 Плохо", "😐 Нормально", "😊 Хорошо", "😴 Отлично"];
const qualityColors = ["", "#C4876C", "#C4A86C", "#A3ADB8", "#7EA8BE", "#9B8EC4"];

const sleepFactors = [
  { id: "stress", label: "Стресс", icon: "😰" },
  { id: "screen", label: "Экраны", icon: "📱" },
  { id: "caffeine", label: "Кофеин", icon: "☕" },
  { id: "exercise", label: "Тренировка", icon: "💪" },
  { id: "late_meal", label: "Поздний ужин", icon: "🍕" },
  { id: "alcohol", label: "Алкоголь", icon: "🍷" },
  { id: "reading", label: "Чтение", icon: "📚" },
  { id: "walk", label: "Прогулка", icon: "🚶" },
  { id: "bath", label: "Ванна", icon: "🛁" },
];

export function SleepPage() {
  const { sleepEntries, addSleepEntry, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();

  const todayEntry = sleepEntries.find((e) => e.date === new Date().toISOString().split("T")[0]);

  const [quality, setQuality] = useState(todayEntry?.quality || 0);
  const [hours, setHours] = useState(todayEntry?.hours || 7);
  const [bedtime, setBedtime] = useState(todayEntry?.bedtime || "23:00");
  const [wakeTime, setWakeTime] = useState(todayEntry?.wakeTime || "07:00");
  const [factors, setFactors] = useState<string[]>(todayEntry?.factors || []);
  const [note, setNote] = useState(todayEntry?.note || "");
  const [saved, setSaved] = useState(!!todayEntry);

  const toggleFactor = (id: string) => {
    setFactors((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (quality === 0) return;
    addSleepEntry({ quality, hours, bedtime, wakeTime, factors, note: note.trim() || undefined });
    setSaved(true);
  };

  // Stats
  const avgQuality = useMemo(() => {
    if (sleepEntries.length === 0) return 0;
    return Math.round((sleepEntries.reduce((s, e) => s + e.quality, 0) / sleepEntries.length) * 10) / 10;
  }, [sleepEntries]);

  const avgHours = useMemo(() => {
    if (sleepEntries.length === 0) return 0;
    return Math.round((sleepEntries.reduce((s, e) => s + e.hours, 0) / sleepEntries.length) * 10) / 10;
  }, [sleepEntries]);

  const topFactors = useMemo(() => {
    const counts: Record<string, { good: number; bad: number }> = {};
    for (const entry of sleepEntries) {
      for (const f of entry.factors) {
        if (!counts[f]) counts[f] = { good: 0, bad: 0 };
        if (entry.quality >= 4) counts[f].good++;
        else if (entry.quality <= 2) counts[f].bad++;
      }
    }
    return Object.entries(counts)
      .map(([id, { good, bad }]) => ({ id, good, bad, label: sleepFactors.find((f) => f.id === id)?.label || id }))
      .sort((a, b) => (b.good + b.bad) - (a.good + a.bad))
      .slice(0, 5);
  }, [sleepEntries]);

  return (
    <div className="px-5 pt-14 pb-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>Сон</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Как вы спали сегодня?</p>
        </div>
        <Moon className="w-5 h-5" style={{ color: t.lavender }} />
      </div>

      {/* Quality */}
      <GlassPanel darkMode={darkMode} color={quality > 0 ? qualityColors[quality] : t.lavender} className="rounded-2xl p-5 mb-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: 12 }}>Качество сна</p>
        <div className="flex justify-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((q) => (
            <motion.button key={q} className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: quality === q ? qualityColors[q] + "20" : t.bgSecondary,
                border: `2px solid ${quality === q ? qualityColors[q] : t.border}`,
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setQuality(q)}>
              <span style={{ fontSize: "1.3rem" }}>{qualityLabels[q].split(" ")[0]}</span>
            </motion.button>
          ))}
        </div>
        {quality > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ fontSize: "0.78rem", color: qualityColors[quality], fontWeight: 600 }}>
            {qualityLabels[quality]}
          </motion.p>
        )}
        </motion.div>
      </GlassPanel>

      {/* Time */}
      <GlassPanel darkMode={darkMode} color={t.dustyBlue} className="rounded-2xl p-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Moon className="w-3.5 h-3.5" style={{ color: t.lavender }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 500, color: t.textMuted }}>Лёг</span>
            </div>
            <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)}
              className="w-full rounded-lg px-2 py-2 text-center outline-none"
              style={{ fontSize: "0.85rem", backgroundColor: t.bgSecondary, color: t.text, border: `1px solid ${t.border}` }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sun className="w-3.5 h-3.5" style={{ color: t.gold }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 500, color: t.textMuted }}>Встал</span>
            </div>
            <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
              className="w-full rounded-lg px-2 py-2 text-center outline-none"
              style={{ fontSize: "0.85rem", backgroundColor: t.bgSecondary, color: t.text, border: `1px solid ${t.border}` }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3.5 h-3.5" style={{ color: t.sage }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 500, color: t.textMuted }}>Часов</span>
            </div>
            <input type="number" min={0} max={16} step={0.5} value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full rounded-lg px-2 py-2 text-center outline-none"
              style={{ fontSize: "0.85rem", backgroundColor: t.bgSecondary, color: t.text, border: `1px solid ${t.border}` }} />
          </div>
        </div>
        </motion.div>
      </GlassPanel>

      {/* Factors */}
      <GlassPanel darkMode={darkMode} color={t.lavender} className="rounded-2xl p-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: 10 }}>Что повлияло на сон?</p>
        <div className="flex flex-wrap gap-2">
          {sleepFactors.map((f) => {
            const selected = factors.includes(f.id);
            return (
              <button key={f.id} className="px-3 py-1.5 rounded-full border"
                style={{
                  fontSize: "0.72rem", fontWeight: selected ? 600 : 400,
                  borderColor: selected ? t.lavender + "40" : t.border,
                  backgroundColor: selected ? t.lavender + "12" : "transparent",
                  color: selected ? t.lavender : t.textMuted,
                }}
                onClick={() => toggleFactor(f.id)}>
                <AppIcon icon={f.icon} size={13} /> {f.label}
              </button>
            );
          })}
        </div>
        </motion.div>
      </GlassPanel>

      {/* Note */}
      <motion.div className="mb-4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Заметка о сне..."
          className="w-full rounded-xl px-4 py-3 border outline-none resize-none"
          style={{ fontSize: "0.85rem", backgroundColor: t.card, borderColor: t.border, color: t.text }}
          rows={2} />
      </motion.div>

      {/* Save */}
      <motion.button className="w-full rounded-xl py-3 font-semibold mb-5"
        style={{
          backgroundColor: saved ? t.sage + "20" : t.lavender,
          color: saved ? t.sage : "#fff",
          fontSize: "0.9rem",
        }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}>
        {saved ? "✓ Сохранено" : "Сохранить"}
      </motion.button>

      {/* Stats */}
      {sleepEntries.length > 1 && (
        <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: 10 }}>Статистика сна</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: t.lavender }}>{avgQuality}</p>
              <p style={{ fontSize: "0.6rem", color: t.textFaint }}>Ср. качество</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: t.dustyBlue }}>{avgHours}ч</p>
              <p style={{ fontSize: "0.6rem", color: t.textFaint }}>Ср. длительность</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: t.sage }}>{sleepEntries.length}</p>
              <p style={{ fontSize: "0.6rem", color: t.textFaint }}>Записей</p>
            </div>
          </div>

          {topFactors.length > 0 && (
            <>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: t.text, marginBottom: 6 }}>Влияние факторов</p>
              {topFactors.map((f) => (
                <div key={f.id} className="flex items-center gap-2 mb-1.5">
                  <span style={{ fontSize: "0.72rem", color: t.textMuted, width: 80 }}>{f.label}</span>
                  <div className="flex-1 flex gap-0.5">
                    {f.good > 0 && (
                      <div className="h-3 rounded-full" style={{ backgroundColor: t.sage + "40", width: `${(f.good / (f.good + f.bad)) * 100}%` }} />
                    )}
                    {f.bad > 0 && (
                      <div className="h-3 rounded-full" style={{ backgroundColor: t.terracotta + "40", width: `${(f.bad / (f.good + f.bad)) * 100}%` }} />
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.sage + "60" }} /><span style={{ fontSize: "0.58rem", color: t.textFaint }}>Хороший сон</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.terracotta + "60" }} /><span style={{ fontSize: "0.58rem", color: t.textFaint }}>Плохой сон</span></div>
              </div>
            </>
          )}

          {/* Last 7 entries */}
          <div className="mt-3">
            <p style={{ fontSize: "0.72rem", fontWeight: 500, color: t.textMuted, marginBottom: 6 }}>Последние дни</p>
            <div className="flex gap-1.5">
              {sleepEntries.slice(0, 7).map((entry) => (
                <div key={entry.id} className="flex-1 text-center">
                  <div className="w-full aspect-square rounded-lg flex items-center justify-center mb-0.5"
                    style={{ backgroundColor: qualityColors[entry.quality] + "18" }}>
                    <span style={{ fontSize: "0.7rem" }}>{qualityLabels[entry.quality]?.split(" ")[0]}</span>
                  </div>
                  <span style={{ fontSize: "0.5rem", color: t.textFaint }}>{entry.hours}ч</span>
                </div>
              ))}
            </div>
          </div>
          </motion.div>
        </GlassPanel>
      )}
    </div>
  );
}
