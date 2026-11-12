import { useState, useMemo, useRef, useCallback } from "react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, TrendingUp, BarChart3, Calendar, Edit3, Trash2, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const today = () => new Date().toISOString().split("T")[0];

const moodOptions = [
  { name: "Радость", emoji: "😊", color: "#C4A86C" },
  { name: "Спокойствие", emoji: "😌", color: "#8DB596" },
  { name: "Энергия", emoji: "😄", color: "#C4876C" },
  { name: "Задумчивость", emoji: "🤔", color: "#7EA8BE" },
  { name: "Грусть", emoji: "😢", color: "#9B8EC4" },
  { name: "Тревога", emoji: "😰", color: "#B88FA7" },
  { name: "Усталость", emoji: "😴", color: "#A3907A" },
  { name: "Раздражение", emoji: "😤", color: "#C4876C" },
];

/* ─── Mood Color Wheel ─── */
function MoodWheel({
  selectedMood,
  onSelect,
  th,
}: {
  selectedMood: number | null;
  onSelect: (i: number) => void;
  th: ReturnType<typeof useTheme>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;
  const innerR = outerR * 0.45;
  const count = moodOptions.length;
  const angleStep = (2 * Math.PI) / count;

  const polarToCart = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  });

  const sectorPath = (i: number) => {
    const startAngle = i * angleStep;
    const endAngle = (i + 1) * angleStep;
    const outerStart = polarToCart(startAngle, outerR);
    const outerEnd = polarToCart(endAngle, outerR);
    const innerStart = polarToCart(startAngle, innerR);
    const innerEnd = polarToCart(endAngle, innerR);
    const largeArc = angleStep > Math.PI ? 1 : 0;
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  };

  const emojiPos = (i: number) => {
    const angle = i * angleStep + angleStep / 2;
    const r = (outerR + innerR) / 2;
    return polarToCart(angle, r);
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size, margin: "0 auto" }}>
      <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {moodOptions.map((mood, i) => (
            <radialGradient key={`grad-${i}`} id={`moodGrad-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={mood.color} stopOpacity={selectedMood === i ? 0.5 : 0.25} />
              <stop offset="100%" stopColor={mood.color} stopOpacity={selectedMood === i ? 0.3 : 0.1} />
            </radialGradient>
          ))}
        </defs>
        {/* Sector segments */}
        {moodOptions.map((mood, i) => {
          const isSelected = selectedMood === i;
          return (
            <g key={i}>
              <path
                d={sectorPath(i)}
                fill={`url(#moodGrad-${i})`}
                stroke={isSelected ? mood.color : th.border}
                strokeWidth={isSelected ? 2.5 : 1}
                style={{ cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => onSelect(i)}
              />
            </g>
          );
        })}
        {/* Emoji labels */}
        {moodOptions.map((_, i) => {
          const pos = emojiPos(i);
          return (
            <text
              key={`emoji-${i}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: "1.4rem", cursor: "pointer", pointerEvents: "none" }}
            >
              {moodOptions[i].emoji}
            </text>
          );
        })}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: "0.65rem", fill: th.textMuted }}>
          {selectedMood !== null ? moodOptions[selectedMood].name : "Как вы?"}
        </text>
        {selectedMood !== null && (
          <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: "1.5rem" }}>
            {moodOptions[selectedMood].emoji}
          </text>
        )}
      </svg>
    </div>
  );
}

/* ─── Mood Map Card (today filled) ─── */
function MoodMapCard({
  entry,
  th,
  onEdit,
  onDelete,
  darkMode,
}: {
  entry: { mood: string; color: string; energy: number; note?: string; date: string };
  th: ReturnType<typeof useTheme>;
  onEdit: () => void;
  onDelete: () => void;
  darkMode: boolean;
}) {
  const moodData = moodOptions.find((m) => m.name === entry.mood) || moodOptions[0];
  const energyLabels = ["", "Очень низкая", "Низкая", "Средняя", "Высокая", "Очень высокая"];

  return (
    <GlassPanel darkMode={darkMode} color={entry.color} className="rounded-2xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.span
            style={{ fontSize: "2.5rem" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AppIcon icon={moodData.emoji} size={40} color={moodData.color} />
          </motion.span>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: th.text }}>{entry.mood}</h3>
            <p style={{ fontSize: "0.75rem", color: th.textMuted }}>
              Сегодня, {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit}>
            <Edit3 className="w-4 h-4" style={{ color: th.textMuted }} />
          </button>
          <button onClick={onDelete}>
            <Trash2 className="w-4 h-4" style={{ color: th.textFaint }} />
          </button>
        </div>
      </div>

      {/* Energy bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1" style={{ fontSize: "0.75rem", color: th.textMuted }}>
            <Zap className="w-3.5 h-3.5" /> Энергия
          </span>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: entry.color }}>
            {energyLabels[entry.energy]}
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: th.border }}>
          <motion.div
            className="h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(entry.energy / 5) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {entry.note && (
        <div className="rounded-xl p-3 mt-3" style={{ backgroundColor: entry.color + "10" }}>
          <p style={{ fontSize: "0.8rem", color: th.textSecondary, fontStyle: "italic", lineHeight: 1.5 }}>
            "{entry.note}"
          </p>
        </div>
      )}
    </GlassPanel>
  );
}

/* ─── Main Mood Page ─── */
export function MoodPage() {
  const { moods, addMoodEntry, deleteMoodEntry, darkMode } = useApp();
  const th = useTheme();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const d = today();
  const todayEntry = moods.find((m) => m.date === d);

  const handleSave = useCallback(() => {
    if (selectedMood === null) return;
    const mood = moodOptions[selectedMood];
    addMoodEntry(mood.name, mood.color, energy, note || undefined);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }, [selectedMood, energy, note, addMoodEntry]);

  const handleEdit = useCallback(() => {
    if (todayEntry) {
      const idx = moodOptions.findIndex((m) => m.name === todayEntry.mood);
      if (idx >= 0) setSelectedMood(idx);
      setEnergy(todayEntry.energy);
      setNote(todayEntry.note || "");
      setIsEditing(true);
    }
  }, [todayEntry]);

  const handleDeleteToday = useCallback(() => {
    if (todayEntry) {
      deleteMoodEntry(todayEntry.id);
      setIsEditing(false);
      setSelectedMood(null);
      setNote("");
      setEnergy(3);
    }
  }, [todayEntry, deleteMoodEntry]);

  const lastWeek = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split("T")[0];
        const entry = moods.find((m) => m.date === dateStr);
        return {
          date: dateStr,
          day: date.toLocaleDateString("ru-RU", { weekday: "short" }),
          entry,
          isToday: dateStr === d,
        };
      }),
    [moods, d]
  );

  const monthCalendar = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const days: Array<{ day: number; dateStr: string; entry?: (typeof moods)[0] } | null> = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({ day, dateStr, entry: moods.find((m) => m.date === dateStr) });
    }
    return { days, monthName: now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }) };
  }, [moods]);

  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    moods.forEach((m) => {
      counts[m.mood] = (counts[m.mood] || 0) + 1;
    });
    const total = moods.length || 1;
    return moodOptions
      .map((opt) => ({ ...opt, count: counts[opt.name] || 0, pct: ((counts[opt.name] || 0) / total) * 100 }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [moods]);

  const weeklyStats = useMemo(() => {
    const weekEntries = lastWeek.filter((d) => d.entry).map((d) => d.entry!);
    if (weekEntries.length === 0) return null;
    const avgEnergy = weekEntries.reduce((s, e) => s + e.energy, 0) / weekEntries.length;
    const dominantMood = (() => {
      const counts: Record<string, number> = {};
      weekEntries.forEach((e) => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
      const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return max ? max[0] : null;
    })();
    return { avgEnergy: avgEnergy.toFixed(1), dominantMood, filledDays: weekEntries.length };
  }, [lastWeek]);

  const showInput = !todayEntry || isEditing;
  const accentColor = selectedMood !== null ? moodOptions[selectedMood].color : th.sage;

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="mb-5">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: th.text }} className="mb-0.5">
          Ваше настроение
        </h1>
        <p style={{ fontSize: "0.82rem", color: th.textMuted }}>
          Все чувства важны — прислушайтесь к себе
        </p>
      </div>

      {/* Week overview */}
      <div className="mb-6">
        <div className="flex gap-1.5">
          {lastWeek.map((day) => (
            <motion.div
              key={day.date}
              className="flex-1 text-center"
              whileHover={{ y: -2 }}
            >
              <span className="block mb-1" style={{ fontSize: "0.6rem", color: day.isToday ? th.text : th.textFaint, fontWeight: day.isToday ? 600 : 400 }}>
                {day.day}
              </span>
              <div
                className="w-full aspect-square rounded-xl flex items-center justify-center border transition-all relative overflow-hidden"
                style={{
                  background: day.entry
                    ? (darkMode
                        ? `linear-gradient(135deg, ${day.entry.color}15, rgba(36,34,32,0.5))`
                        : `linear-gradient(135deg, ${day.entry.color}15, rgba(255,255,255,0.4))`)
                    : (darkMode
                        ? "linear-gradient(135deg, rgba(36,34,32,0.6), rgba(36,34,32,0.3))"
                        : "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3))"),
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderColor: day.isToday ? (day.entry?.color || th.sage) + "50" : day.entry ? day.entry.color + "25" : (darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"),
                  borderWidth: day.isToday ? 2 : 1,
                }}
              >
                {day.entry ? (
                  <motion.span
                    style={{ fontSize: "1rem" }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {moodOptions.find((m) => m.name === day.entry!.mood)?.emoji || "😊"}
                  </motion.span>
                ) : (
                  <span style={{ fontSize: "0.65rem", color: th.textFaint }}>—</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Weekly insight */}
        {weeklyStats && (
          <GlassPanel darkMode={darkMode} color={th.sage} className="rounded-xl mt-3 px-3 py-2">
            <div className="flex items-center justify-between" style={{ fontSize: "0.72rem", color: th.textMuted }}>
              <span>
                📊 {weeklyStats.filledDays}/7 дней · Энергия ⌀{weeklyStats.avgEnergy}
              </span>
              {weeklyStats.dominantMood && (
                <span>
                  {moodOptions.find((m) => m.name === weeklyStats.dominantMood)?.emoji}{" "}
                  {weeklyStats.dominantMood}
                </span>
              )}
            </div>
          </GlassPanel>
        )}
      </div>

      {/* ─── Mood Map Card (if today is filled) ─── */}
      {todayEntry && !isEditing ? (
        <MoodMapCard entry={todayEntry} th={th} onEdit={handleEdit} onDelete={handleDeleteToday} darkMode={darkMode} />
      ) : showInput ? (
        <>
          {/* Color Wheel */}
          <div className="mb-5">
            <p
              className="text-center mb-4"
              style={{ fontSize: "0.85rem", fontWeight: 500, color: th.textSecondary }}
            >
              Нажмите на сектор, чтобы выбрать настроение
            </p>
            <MoodWheel selectedMood={selectedMood} onSelect={setSelectedMood} th={th} />
          </div>

          {/* Energy slider */}
          <GlassPanel darkMode={darkMode} color={accentColor} className="rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5" style={{ fontSize: "0.82rem", fontWeight: 600, color: th.text }}>
                <Zap className="w-4 h-4" style={{ color: accentColor }} /> Уровень энергии
              </span>
              <span style={{ fontSize: "0.75rem", color: accentColor, fontWeight: 600 }}>
                {energy}/5
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <motion.button
                  key={val}
                  className="flex-1 py-2.5 rounded-xl transition-all"
                  style={{
                    background: val <= energy
                      ? (darkMode ? `${accentColor}25` : `${accentColor}18`)
                      : (darkMode ? "rgba(36,34,32,0.5)" : "rgba(255,255,255,0.4)"),
                    border: `1px solid ${val <= energy ? accentColor + "40" : (darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)")}`,
                    color: val <= energy ? accentColor : th.textFaint,
                    fontSize: "0.75rem",
                    fontWeight: val <= energy ? 600 : 400,
                  }}
                  onClick={() => setEnergy(val)}
                  whileTap={{ scale: 0.92 }}
                >
                  {val === 1 ? "😴" : val === 2 ? "😕" : val === 3 ? "😐" : val === 4 ? "😊" : "🔥"}
                </motion.button>
              ))}
            </div>
          </GlassPanel>

          {/* Note */}
          <GlassPanel darkMode={darkMode} color={accentColor} className="rounded-2xl p-4 mb-5">
            <p style={{ fontSize: "0.8rem", fontWeight: 500, color: th.text, marginBottom: 8 }}>
              Заметка (необязательно)
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Что повлияло на настроение?..."
              rows={3}
              className="w-full rounded-xl px-4 py-3 border outline-none resize-none"
              style={{
                fontSize: "0.85rem",
                backgroundColor: darkMode ? "rgba(36,34,32,0.6)" : "rgba(255,255,255,0.5)",
                borderColor: darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.4)",
                color: th.text,
                backdropFilter: "blur(8px)",
              }}
            />
          </GlassPanel>

          {/* Save button */}
          <motion.button
            className="w-full text-white rounded-2xl py-3.5 mb-5"
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              backgroundColor: selectedMood !== null ? accentColor : th.textFaint,
              opacity: selectedMood !== null ? 1 : 0.5,
            }}
            onClick={handleSave}
            whileTap={{ scale: 0.98 }}
            disabled={selectedMood === null}
          >
            {saved ? "✨ Сохранено!" : isEditing ? "Обновить настроение" : "Сохранить настроение"}
          </motion.button>
        </>
      ) : null}

      {/* ─── Monthly Calendar ─── */}
      <GlassPanel darkMode={darkMode} color={th.lavender} className="rounded-2xl p-4 mb-5">
        <button
          className="flex items-center justify-between w-full mb-3"
          onClick={() => setShowCalendar(!showCalendar)}
        >
          <span className="flex items-center gap-2" style={{ fontSize: "0.9rem", fontWeight: 600, color: th.text }}>
            <Calendar className="w-4 h-4" style={{ color: th.lavender }} />
            {monthCalendar.monthName}
          </span>
          {showCalendar ? (
            <ChevronUp className="w-4 h-4" style={{ color: th.textFaint }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: th.textFaint }} />
          )}
        </button>

        <AnimatePresence>
          {showCalendar && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((dl) => (
                  <span key={dl} className="text-center" style={{ fontSize: "0.55rem", color: th.textFaint }}>
                    {dl}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthCalendar.days.map((cell, i) =>
                  cell === null ? (
                    <div key={`empty-${i}`} />
                  ) : (
                    <div
                      key={cell.dateStr}
                      className="aspect-square rounded-lg flex items-center justify-center relative"
                      style={{
                        backgroundColor: cell.entry ? cell.entry.color + "18" : "transparent",
                        border: cell.dateStr === d ? `2px solid ${th.sage}` : "none",
                      }}
                    >
                      {cell.entry ? (
                        <span style={{ fontSize: "0.7rem" }}>
                          {moodOptions.find((m) => m.name === cell.entry!.mood)?.emoji || "·"}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.6rem", color: th.textFaint }}>{cell.day}</span>
                      )}
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassPanel>

      {/* ─── Mood Distribution ─── */}
      {moodDistribution.length > 0 && (
        <GlassPanel darkMode={darkMode} color={th.dustyBlue} className="rounded-2xl p-4 mb-5">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: "0.9rem", fontWeight: 600, color: th.text }}>
            <BarChart3 className="w-4 h-4" style={{ color: th.dustyBlue }} />
            Распределение настроений
          </h3>
          <div className="space-y-2.5">
            {moodDistribution.map((mood) => (
              <div key={mood.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5" style={{ fontSize: "0.78rem", color: th.text }}>
                    <AppIcon icon={mood.emoji} size={15} color={mood.color} /> {mood.name}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: th.textMuted }}>
                    {mood.count}x ({mood.pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: mood.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${mood.pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Empty state */}
      {moods.length === 0 && !showInput && (
        <div className="text-center py-10">
          <span style={{ fontSize: "2.5rem" }}>🌈</span>
          <p style={{ fontSize: "0.9rem", color: th.textMuted, marginTop: 8 }}>
            Начните отслеживать настроение
          </p>
          <p style={{ fontSize: "0.78rem", color: th.textFaint, marginTop: 4 }}>
            Каждый день — новый оттенок
          </p>
        </div>
      )}
    </div>
  );
}