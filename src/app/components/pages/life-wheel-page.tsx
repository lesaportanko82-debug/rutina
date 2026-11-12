import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const areas = [
  { id: "health", name: "Здоровье", icon: "❤️", color: "#C4876C" },
  { id: "career", name: "Карьера", icon: "💼", color: "#7EA8BE" },
  { id: "finance", name: "Финансы", icon: "💰", color: "#C4A86C" },
  { id: "relations", name: "Отношения", icon: "💕", color: "#B88FA7" },
  { id: "growth", name: "Развитие", icon: "📚", color: "#9B8EC4" },
  { id: "fun", name: "Отдых", icon: "🎉", color: "#7BAFB0" },
  { id: "creativity", name: "Творчество", icon: "🎨", color: "#C4956A" },
  { id: "environment", name: "Среда", icon: "🏠", color: "#8DB596" },
];

const defaultScores: Record<string, number> = {
  health: 5, career: 5, finance: 5, relations: 5,
  growth: 5, fun: 5, creativity: 5, environment: 5,
};

export function LifeWheelPage() {
  const { lifeWheelEntries, addLifeWheelEntry, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const latest = lifeWheelEntries[lifeWheelEntries.length - 1];
    return latest ? { ...defaultScores, ...latest.scores } : { ...defaultScores };
  });

  const today = new Date().toISOString().split("T")[0];
  const todayEntry = lifeWheelEntries.find((e) => e.date === today);

  // Chart data
  const chartData = useMemo(() =>
    areas.map((a) => ({
      area: a.name,
      value: scores[a.id] || 5,
      fullMark: 10,
    })),
    [scores]
  );

  // Previous entries for comparison
  const prevEntry = useMemo(() => {
    const sorted = [...lifeWheelEntries].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.length >= 2 ? sorted[1] : null;
  }, [lifeWheelEntries]);

  const prevChartData = useMemo(() => {
    if (!prevEntry) return null;
    return areas.map((a) => ({
      area: a.name,
      value: prevEntry.scores[a.id] || 5,
      fullMark: 10,
    }));
  }, [prevEntry]);

  // Average score
  const avgScore = useMemo(() => {
    const vals = Object.values(scores);
    return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  }, [scores]);

  // Balance metric (lower std dev = more balanced)
  const balance = useMemo(() => {
    const vals = Object.values(scores);
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, Math.round((1 - stdDev / 4.5) * 100));
  }, [scores]);

  const handleSave = () => {
    addLifeWheelEntry(scores);
    setEditing(false);
  };

  // History
  const history = useMemo(() =>
    [...lifeWheelEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [lifeWheelEntries]
  );

  // Weakest/strongest
  const sorted = useMemo(() =>
    [...areas].sort((a, b) => (scores[a.id] || 5) - (scores[b.id] || 5)),
    [scores]
  );

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>Колесо жизни</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Оцените баланс 8 сфер</p>
        </div>
        {editing && (
          <motion.button onClick={handleSave} className="p-2 rounded-xl" style={{ backgroundColor: t.sage + "18" }}
            whileTap={{ scale: 0.9 }}>
            <Save className="w-5 h-5" style={{ color: t.sage }} />
          </motion.button>
        )}
      </div>

      {/* Radar chart */}
      <GlassPanel darkMode={darkMode} color={t.sage} className="rounded-2xl p-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke={t.border} />
              <PolarAngleAxis dataKey="area" tick={{ fontSize: 10, fill: t.textMuted }} />
              {prevChartData && (
                <Radar name="Прошлый" dataKey="value" data={prevChartData}
                  stroke="#9B8EC440" fill="#9B8EC410" strokeWidth={1} strokeDasharray="4 4" />
              )}
              <Radar name="Сейчас" dataKey="value" stroke="#8DB596" fill="#8DB59620" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: t.sage }}>{avgScore}</p>
              <p style={{ fontSize: "0.6rem", color: t.textFaint }}>Средний балл</p>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: balance >= 70 ? "#8DB596" : balance >= 40 ? "#C4A86C" : "#C4876C" }}>{balance}%</p>
              <p style={{ fontSize: "0.6rem", color: t.textFaint }}>Баланс</p>
            </div>
          </div>
        </motion.div>
      </GlassPanel>

      {/* Edit / View sliders */}
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>
          {editing ? "Оцените каждую сферу" : "Ваши оценки"}
        </h2>
        {!editing && (
          <button className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: t.lavender + "18", fontSize: "0.72rem", fontWeight: 600, color: t.lavender }}
            onClick={() => setEditing(true)}>
            {todayEntry ? "Обновить" : "Оценить"}
          </button>
        )}
      </div>

      <div className="space-y-3 mb-5">
        {areas.map((area, i) => (
          <GlassPanel key={area.id} darkMode={darkMode} color={area.color} className="rounded-xl p-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{ fontSize: "0.85rem" }}><AppIcon icon={area.icon} size={16} color={area.color} /></span>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text }}>{area.name}</span>
                <span className="ml-auto px-2 py-0.5 rounded-full" style={{
                  fontSize: "0.65rem", fontWeight: 700,
                  backgroundColor: area.color + "18", color: area.color,
                }}>
                  {scores[area.id]}/10
                </span>
              </div>
              {editing ? (
                <input type="range" min={1} max={10} value={scores[area.id]}
                  onChange={(e) => setScores((s) => ({ ...s, [area.id]: Number(e.target.value) }))}
                  className="w-full" style={{ accentColor: area.color }} />
              ) : (
                <div className="w-full rounded-full h-1.5" style={{ backgroundColor: t.border }}>
                  <motion.div className="h-1.5 rounded-full" style={{ backgroundColor: area.color }}
                    initial={{ width: 0 }} animate={{ width: `${(scores[area.id] / 10) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }} />
                </div>
              )}
            </motion.div>
          </GlassPanel>
        ))}
      </div>

      {editing && (
        <motion.button className="w-full rounded-xl py-3 font-semibold mb-5"
          style={{ backgroundColor: t.sage, color: "#fff", fontSize: "0.9rem" }}
          whileTap={{ scale: 0.95 }} onClick={handleSave}>
          Сохранить оценку
        </motion.button>
      )}

      {/* Insights */}
      {!editing && (
        <GlassPanel darkMode={darkMode} color={t.lavender} className="rounded-2xl p-4 mb-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Инсайты</p>
            <div className="space-y-2">
              <p style={{ fontSize: "0.72rem", color: t.textMuted }}>
                🌟 <strong style={{ color: sorted[sorted.length - 1].color }}>Сильная сторона:</strong> {sorted[sorted.length - 1].name} ({scores[sorted[sorted.length - 1].id]}/10)
              </p>
              <p style={{ fontSize: "0.72rem", color: t.textMuted }}>
                🌱 <strong style={{ color: sorted[0].color }}>Зона роста:</strong> {sorted[0].name} ({scores[sorted[0].id]}/10)
              </p>
              {prevEntry && (
                <p style={{ fontSize: "0.72rem", color: t.textMuted }}>
                  📈 Динамика: средний балл {(() => {
                    const prevAvg = Object.values(prevEntry.scores).reduce((s, v) => s + v, 0) / Object.values(prevEntry.scores).length;
                    const diff = Number(avgScore) - prevAvg;
                    return diff > 0 ? `+${diff.toFixed(1)} — растёте!` : diff < 0 ? `${diff.toFixed(1)} — стоит обратить внимание` : "без изменений";
                  })()}
                </p>
              )}
            </div>
          </motion.div>
        </GlassPanel>
      )}

      {/* History */}
      {history.length > 1 && (
        <>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>История</h3>
          <div className="space-y-2">
            {history.map((entry) => {
              const avg = (Object.values(entry.scores).reduce((s, v) => s + v, 0) / Object.values(entry.scores).length).toFixed(1);
              return (
                <GlassPanel key={entry.id} darkMode={darkMode} color={t.dustyBlue} className="rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 500, color: t.text }}>
                        {new Date(entry.date).toLocaleDateString("ru", { day: "numeric", month: "long" })}
                      </p>
                      <p style={{ fontSize: "0.62rem", color: t.textFaint }}>Средний балл: {avg}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {areas.map((a) => (
                        <div key={a.id} className="w-3 h-3 rounded-sm"
                          style={{
                            backgroundColor: (entry.scores[a.id] || 5) >= 7 ? "#8DB596" :
                              (entry.scores[a.id] || 5) >= 4 ? "#C4A86C" : "#C4876C",
                            opacity: 0.6 + ((entry.scores[a.id] || 5) / 10) * 0.4,
                          }} />
                      ))}
                    </div>
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}