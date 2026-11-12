import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  Area, AreaChart, Tooltip, ComposedChart,
} from "recharts";
import { TrendingUp, Target, Brain, Lightbulb, Timer, ArrowUpRight, ArrowDownRight, Activity, Sunrise, Moon as MoonIcon } from "lucide-react";
import { getPersonalizedRecommendations } from "../recommendations-engine";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { AppIcon } from "../app-icon";

const categoryColors: Record<string, string> = { work: "#7EA8BE", personal: "#9B8EC4", health: "#8DB596", study: "#C4A86C" };
const categoryLabelsMap: Record<string, string> = { work: "Работа", personal: "Личное", health: "Здоровье", study: "Учёба" };

const moodOptionsMap: Record<string, { color: string; emoji: string }> = {
  "Радость": { color: "#C4A86C", emoji: "😊" },
  "Спокойствие": { color: "#8DB596", emoji: "😌" },
  "Энергия": { color: "#C4876C", emoji: "😄" },
  "Задумчивость": { color: "#7EA8BE", emoji: "🤔" },
  "Грусть": { color: "#9B8EC4", emoji: "😢" },
  "Тревога": { color: "#B88FA7", emoji: "😰" },
  "Усталость": { color: "#A3907A", emoji: "😴" },
  "Раздражение": { color: "#C4876C", emoji: "😤" },
};

function getLevelColor(level: number): string {
  if (level <= 2) return "#8DB596";
  if (level <= 4) return "#C4A86C";
  if (level <= 6) return "#C4876C";
  if (level <= 8) return "#B8696C";
  return "#9B5A5E";
}

// ─── Tab definitions ───
const tabs = [
  { id: "overview", label: "Обзор" },
  { id: "mood", label: "Настроение" },
  { id: "anxiety", label: "Тревога" },
  { id: "rituals", label: "Ритуалы" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function StatsPage() {
  const { tasks, habits, moods, profile, pomodoroStats, questionnaire, anxietyEntries, dailyIntentions, eveningCheckins, darkMode } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const completedTasks = tasks.filter((tk) => tk.completed).length;
  const avgEnergy = moods.length > 0 ? moods.reduce((s, m) => s + m.energy, 0) / moods.length : 0;

  const categoryData = useMemo(() =>
    Object.keys(categoryColors).map((cat) => ({
      name: categoryLabelsMap[cat], value: tasks.filter((tk) => tk.category === cat).length, color: categoryColors[cat],
    })).filter((dd) => dd.value > 0),
  [tasks]);

  const habitData = habits.map((h) => ({ name: h.icon, streak: h.streak, best: h.bestStreak, color: h.color }));

  const moodEnergyData = useMemo(() =>
    moods.slice(-14).map((m) => ({
      date: new Date(m.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }), energy: m.energy,
    })),
  [moods]);

  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    moods.forEach((m) => { counts[m.mood] = (counts[m.mood] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name, value, color: moodOptionsMap[name]?.color || "#B5AFA6",
    }));
  }, [moods]);

  // Anxiety stats
  const anxietyStats = useMemo(() => {
    if (anxietyEntries.length === 0) return null;
    const avg = anxietyEntries.reduce((s, e) => s + e.level, 0) / anxietyEntries.length;
    const breathingUsed = anxietyEntries.filter((e) => e.usedBreathing).length;
    const groundingUsed = anxietyEntries.filter((e) => e.usedGrounding).length;

    const trendData = [...anxietyEntries]
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(-14)
      .map((e) => ({
        date: new Date(e.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
        level: e.level, trigger: e.trigger,
      }));

    const dayAvg: Record<number, { sum: number; count: number }> = {};
    for (let i = 0; i < 7; i++) dayAvg[i] = { sum: 0, count: 0 };
    anxietyEntries.forEach((e) => {
      const dow = new Date(e.date + "T12:00:00").getDay();
      dayAvg[dow].sum += e.level;
      dayAvg[dow].count += 1;
    });
    const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const dayData = [1, 2, 3, 4, 5, 6, 0].map((d) => ({
      day: dayNames[d],
      avg: dayAvg[d].count > 0 ? Math.round((dayAvg[d].sum / dayAvg[d].count) * 10) / 10 : 0,
      count: dayAvg[d].count,
    }));

    const triggerFreq: Record<string, number> = {};
    anxietyEntries.forEach((e) => { if (e.trigger) triggerFreq[e.trigger] = (triggerFreq[e.trigger] || 0) + 1; });
    const topTriggers = Object.entries(triggerFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { avg, breathingUsed, groundingUsed, trendData, dayData, topTriggers, total: anxietyEntries.length };
  }, [anxietyEntries]);

  // Correlation
  const correlation = useMemo(() => {
    if (anxietyEntries.length < 2 || moods.length < 2) return null;
    const anxietyByDate: Record<string, { sum: number; count: number }> = {};
    anxietyEntries.forEach((e) => {
      if (!anxietyByDate[e.date]) anxietyByDate[e.date] = { sum: 0, count: 0 };
      anxietyByDate[e.date].sum += e.level; anxietyByDate[e.date].count += 1;
    });
    const data: { date: string; anxiety: number; energy: number; mood: string }[] = [];
    moods.forEach((m) => {
      if (anxietyByDate[m.date]) {
        data.push({
          date: new Date(m.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
          anxiety: Math.round((anxietyByDate[m.date].sum / anxietyByDate[m.date].count) * 10) / 10,
          energy: m.energy, mood: m.mood,
        });
      }
    });
    if (data.length < 2) return null;
    const n = data.length;
    const sA = data.reduce((s, d) => s + d.anxiety, 0);
    const sE = data.reduce((s, d) => s + d.energy, 0);
    const sAE = data.reduce((s, d) => s + d.anxiety * d.energy, 0);
    const sA2 = data.reduce((s, d) => s + d.anxiety * d.anxiety, 0);
    const sE2 = data.reduce((s, d) => s + d.energy * d.energy, 0);
    const num = n * sAE - sA * sE;
    const den = Math.sqrt((n * sA2 - sA * sA) * (n * sE2 - sE * sE));
    const r = den !== 0 ? num / den : 0;
    return { data: data.slice(-10), r };
  }, [anxietyEntries, moods]);

  // Week comparison
  const weekComparison = useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now); thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const tw = thisWeekStart.toISOString().split("T")[0];
    const lw = lastWeekStart.toISOString().split("T")[0];
    const twMoods = moods.filter((m) => m.date >= tw);
    const lwMoods = moods.filter((m) => m.date >= lw && m.date < tw);
    const twEnergy = twMoods.length > 0 ? twMoods.reduce((s, m) => s + m.energy, 0) / twMoods.length : 0;
    const lwEnergy = lwMoods.length > 0 ? lwMoods.reduce((s, m) => s + m.energy, 0) / lwMoods.length : 0;
    const twHabits = habits.reduce((sum, h) => sum + h.completedDates.filter((dd) => dd >= tw).length, 0);
    const lwHabits = habits.reduce((sum, h) => sum + h.completedDates.filter((dd) => dd >= lw && dd < tw).length, 0);
    return {
      energyDiff: twEnergy - lwEnergy, habitsDiff: twHabits - lwHabits,
      thisEnergy: twEnergy.toFixed(1), thisHabits: twHabits,
      hasPrevData: lwMoods.length > 0 || lwHabits > 0,
    };
  }, [moods, habits]);

  const recommendations = useMemo(
    () => getPersonalizedRecommendations({ questionnaire, tasks, habits, moods, profile, pomodoroStats }),
    [questionnaire, tasks, habits, moods, profile, pomodoroStats]
  );

  const AnxietyTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg px-3 py-2 shadow-lg" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 600, color: t.text }}>{d.date}</p>
        <p style={{ fontSize: "0.68rem", color: getLevelColor(d.level) }}>Тревога: {d.level}/10</p>
        {d.trigger && <p style={{ fontSize: "0.65rem", color: t.textMuted }}>{d.trigger}</p>}
      </div>
    );
  };

  const CorrelationTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg px-3 py-2 shadow-lg" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 600, color: t.text }}>{d.date}</p>
        <p style={{ fontSize: "0.68rem", color: t.lavender }}>Тревога: {d.anxiety}</p>
        <p style={{ fontSize: "0.68rem", color: t.sage }}>Энергия: {d.energy}</p>
      </div>
    );
  };

  // ─── visible tabs: hide anxiety if no data ───
  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === "anxiety" && anxietyEntries.length === 0) return false;
    if (tab.id === "rituals" && dailyIntentions.length === 0 && eveningCheckins.length === 0) return false;
    return true;
  });

  return (
    <div className="px-5 pt-12 pb-8">
      <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text }} className="mb-1">Аналитика</h1>
      <p style={{ fontSize: "0.78rem", color: t.textMuted, marginBottom: 14 }}>
        Без осуждения, с теплом
      </p>

      {/* ─── Tab bar ─── */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className="px-3.5 py-2 rounded-xl shrink-0 transition-all relative overflow-hidden"
            style={{
              fontSize: "0.78rem",
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? "#fff" : t.textMuted,
              backgroundColor: activeTab === tab.id ? "#8DB596" : t.bgSecondary,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {/* ════════════════════════════════ OVERVIEW ════════════════════════════════ */}
      {activeTab === "overview" && (
        <motion.div key="overview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl p-3.5 border" style={{ backgroundColor: t.lavender + "0D", borderColor: t.lavender + "20" }}>
              <TrendingUp className="w-4 h-4 mb-1.5" style={{ color: t.lavender }} />
              <span className="block" style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text }}>{completedTasks}</span>
              <span style={{ fontSize: "0.68rem", color: t.textMuted }}>Задач выполнено</span>
            </div>
            <div className="rounded-2xl p-3.5 border" style={{ backgroundColor: t.sage + "0D", borderColor: t.sage + "20" }}>
              <Brain className="w-4 h-4 mb-1.5" style={{ color: t.sage }} />
              <span className="block" style={{ fontSize: "1.3rem", fontWeight: 700, color: t.text }}>{avgEnergy.toFixed(1)}</span>
              <span style={{ fontSize: "0.68rem", color: t.textMuted }}>Средняя энергия</span>
            </div>
          </div>

          {/* Week comparison */}
          {weekComparison.hasPrevData && (
            <div className="rounded-2xl p-3.5 mb-5 border" style={{ backgroundColor: t.card, borderColor: t.border }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, marginBottom: 8, display: "block" }}>Эта неделя vs прошлая</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-2.5" style={{ backgroundColor: t.bgSecondary }}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span style={{ fontSize: "0.65rem", color: t.textMuted }}>Энергия</span>
                    {weekComparison.energyDiff >= 0
                      ? <ArrowUpRight className="w-3 h-3" style={{ color: t.sage }} />
                      : <ArrowDownRight className="w-3 h-3" style={{ color: t.terracotta }} />}
                  </div>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: t.text }}>{weekComparison.thisEnergy}</span>
                  <span style={{ fontSize: "0.6rem", color: weekComparison.energyDiff >= 0 ? t.sage : t.terracotta, marginLeft: 4 }}>
                    {weekComparison.energyDiff >= 0 ? "+" : ""}{weekComparison.energyDiff.toFixed(1)}
                  </span>
                </div>
                <div className="rounded-xl p-2.5" style={{ backgroundColor: t.bgSecondary }}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span style={{ fontSize: "0.65rem", color: t.textMuted }}>Привычки</span>
                    {weekComparison.habitsDiff >= 0
                      ? <ArrowUpRight className="w-3 h-3" style={{ color: t.sage }} />
                      : <ArrowDownRight className="w-3 h-3" style={{ color: t.terracotta }} />}
                  </div>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: t.text }}>{weekComparison.thisHabits}</span>
                  <span style={{ fontSize: "0.6rem", color: weekComparison.habitsDiff >= 0 ? t.sage : t.terracotta, marginLeft: 4 }}>
                    {weekComparison.habitsDiff >= 0 ? "+" : ""}{weekComparison.habitsDiff}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pomodoro */}
          <div className="rounded-2xl p-3.5 mb-5 text-white" style={{ background: "linear-gradient(135deg, #A3907A, #8D7F6B)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: "0.95rem" }}>🍅</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Время фокуса</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg p-2 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <span className="block" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{pomodoroStats.totalSessions}</span>
                <span style={{ fontSize: "0.58rem", opacity: 0.8 }}>Сессий</span>
              </div>
              <div className="flex-1 rounded-lg p-2 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <span className="block" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{pomodoroStats.totalMinutes}</span>
                <span style={{ fontSize: "0.58rem", opacity: 0.8 }}>Минут</span>
              </div>
              <div className="flex-1 rounded-lg p-2 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <span className="block" style={{ fontSize: "1.1rem", fontWeight: 700 }}>{Math.round(pomodoroStats.totalMinutes / 60 * 10) / 10}</span>
                <span style={{ fontSize: "0.58rem", opacity: 0.8 }}>Часов</span>
              </div>
            </div>
          </div>

          {/* Category & habit streaks */}
          {categoryData.length > 0 && (
            <div className="rounded-2xl p-3.5 border mb-5" style={{ backgroundColor: t.card, borderColor: t.border }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>Задачи по категориям</span>
              <div className="flex items-center mt-2.5">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={22} outerRadius={40} dataKey="value" strokeWidth={2} stroke={t.card}>
                      {categoryData.map((dd) => (<Cell key={dd.name} fill={dd.color} opacity={0.7} />))}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1 pl-3">
                  {categoryData.map((dd) => (
                    <div key={dd.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dd.color, opacity: 0.7 }} />
                      <span style={{ fontSize: "0.72rem", color: t.textSecondary }}>{dd.name}</span>
                      <span className="ml-auto" style={{ fontSize: "0.68rem", fontWeight: 600, color: t.textMuted }}>{dd.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {habitData.length > 0 && (
            <div className="rounded-2xl p-3.5 border mb-5" style={{ backgroundColor: t.card, borderColor: t.border }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>Стрики привычек</span>
              <div className="mt-2 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={habitData}>
                    <XAxis dataKey="name" tick={{ fontSize: 14 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Bar dataKey="streak" radius={[6, 6, 0, 0]}>
                      {habitData.map((dd) => (<Cell key={dd.name} fill={dd.color} opacity={0.65} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4" style={{ color: t.gold }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Рекомендации</span>
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 4).map((rec) => (
                <div key={rec.id} className="rounded-xl p-3 border" style={{ backgroundColor: t.card, borderColor: t.border }}>
                  <div className="flex items-start gap-2.5">
                    <span style={{ fontSize: "1.1rem", lineHeight: 1 }}><AppIcon icon={rec.icon} size={18} /></span>
                    <div className="flex-1 min-w-0">
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text }}>{rec.title}</span>
                      <p style={{ fontSize: "0.7rem", color: t.textMuted, lineHeight: 1.4, marginTop: 2 }}>{rec.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════ MOOD ════════════════════════════════ */}
      {activeTab === "mood" && (
        <motion.div key="mood" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {moodDistribution.length > 0 && (
            <div className="rounded-2xl p-3.5 border mb-5" style={{ backgroundColor: t.card, borderColor: t.border }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>Распределение настроений</span>
              <div className="flex items-center mt-2.5">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={moodDistribution} cx="50%" cy="50%" innerRadius={22} outerRadius={40} dataKey="value" strokeWidth={2} stroke={t.card}>
                      {moodDistribution.map((dd) => (<Cell key={dd.name} fill={dd.color} opacity={0.7} />))}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1 pl-3">
                  {moodDistribution.map((dd) => (
                    <div key={dd.name} className="flex items-center gap-2">
                      <span style={{ fontSize: "0.72rem" }}>{moodOptionsMap[dd.name]?.emoji || "😊"}</span>
                      <span style={{ fontSize: "0.72rem", color: t.textSecondary }}>{dd.name}</span>
                      <span className="ml-auto" style={{ fontSize: "0.68rem", fontWeight: 600, color: t.textMuted }}>{dd.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {moodEnergyData.length > 1 && (
            <div className="rounded-2xl p-3.5 border mb-5" style={{ backgroundColor: t.card, borderColor: t.border }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>Тренд энергии</span>
              <div className="mt-2 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodEnergyData}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: t.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} hide />
                    <Line type="monotone" dataKey="energy" stroke={t.lavender} strokeWidth={2.5} dot={{ fill: t.lavender, r: 3 }} opacity={0.7} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Correlation */}
          {correlation && (
            <div className="rounded-2xl p-3.5 border mb-5" style={{ backgroundColor: t.card, borderColor: t.border }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, marginBottom: 8, display: "block" }}>Тревога ↔ Энергия</span>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={correlation.data}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: t.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" domain={[0, 10]} hide />
                    <YAxis yAxisId="right" domain={[0, 5]} orientation="right" hide />
                    <Tooltip content={<CorrelationTooltip />} />
                    <Line yAxisId="left" type="monotone" dataKey="anxiety" stroke={t.lavender} strokeWidth={2} dot={{ r: 2.5, fill: t.lavender }} />
                    <Line yAxisId="right" type="monotone" dataKey="energy" stroke={t.sage} strokeWidth={2} dot={{ r: 2.5, fill: t.sage }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.lavender }} />
                  <span style={{ fontSize: "0.6rem", color: t.textMuted }}>Тревога</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.sage }} />
                  <span style={{ fontSize: "0.6rem", color: t.textMuted }}>Энергия</span>
                </div>
              </div>
              <p className="mt-2 px-2 py-1.5 rounded-lg" style={{ fontSize: "0.68rem", color: t.textMuted, backgroundColor: t.bgSecondary, lineHeight: 1.5 }}>
                {correlation.r < -0.3
                  ? "Обнаружена обратная связь: тревога снижает энергию."
                  : correlation.r > 0.3
                    ? "Тревога и энергия растут вместе — возможно, связано с активностью."
                    : "Явной связи не обнаружено — разные факторы влияют."}
              </p>
            </div>
          )}

          {moods.length === 0 && (
            <div className="text-center py-10">
              <span style={{ fontSize: "2rem" }}>😊</span>
              <p style={{ fontSize: "0.82rem", color: t.textMuted, marginTop: 8 }}>Отмечайте настроение — здесь появится аналитика</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ════════════════════════════════ ANXIETY ════════════════════════════════ */}
      {activeTab === "anxiety" && anxietyStats && (
        <motion.div key="anxiety" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <span className="block" style={{ fontSize: "1rem", fontWeight: 700, color: getLevelColor(Math.round(anxietyStats.avg)) }}>
                {anxietyStats.avg.toFixed(1)}
              </span>
              <span style={{ fontSize: "0.55rem", color: t.textMuted }}>Среднее</span>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <span className="block" style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>{anxietyStats.total}</span>
              <span style={{ fontSize: "0.55rem", color: t.textMuted }}>Записей</span>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <span className="block" style={{ fontSize: "1rem", fontWeight: 700, color: t.sage }}>
                {anxietyStats.breathingUsed + anxietyStats.groundingUsed}
              </span>
              <span style={{ fontSize: "0.55rem", color: t.textMuted }}>Практик</span>
            </div>
          </div>

          {/* Trend chart */}
          {anxietyStats.trendData.length > 1 && (
            <div className="rounded-2xl p-3.5 border mb-5" style={{ backgroundColor: t.card, borderColor: t.border }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, display: "block", marginBottom: 8 }}>Тренд</span>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={anxietyStats.trendData}>
                    <defs>
                      <linearGradient id="anxGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={t.lavender} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={t.lavender} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: t.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} hide />
                    <Tooltip content={<AnxietyTooltip />} />
                    <Area type="monotone" dataKey="level" stroke={t.lavender} strokeWidth={2.5} fill="url(#anxGrad)" dot={{ fill: t.lavender, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Day pattern */}
          {anxietyStats.dayData.some((d) => d.count > 0) && (
            <div className="rounded-2xl p-3.5 border mb-5" style={{ backgroundColor: t.card, borderColor: t.border }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>По дням недели</span>
              <div className="mt-2 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={anxietyStats.dayData}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: t.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} hide />
                    <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                      {anxietyStats.dayData.map((dd, i) => (
                        <Cell key={i} fill={dd.avg > 0 ? getLevelColor(Math.round(dd.avg)) : t.border} opacity={dd.avg > 0 ? 0.65 : 0.2} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top triggers */}
          {anxietyStats.topTriggers.length > 0 && (
            <div className="rounded-2xl p-3.5 border mb-5" style={{ backgroundColor: t.card, borderColor: t.border }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text, display: "block", marginBottom: 8 }}>Триггеры</span>
              <div className="space-y-2">
                {anxietyStats.topTriggers.map(([trigger, count], i) => {
                  const pct = (count / anxietyStats.total) * 100;
                  return (
                    <div key={trigger}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: t.text }}>{trigger}</span>
                        <span style={{ fontSize: "0.65rem", color: t.textMuted }}>{count}x</span>
                      </div>
                      <div className="w-full rounded-full h-1.5" style={{ backgroundColor: t.border }}>
                        <motion.div className="h-1.5 rounded-full" style={{ backgroundColor: t.lavender }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={() => navigate("/anxiety")} className="w-full py-3 rounded-xl text-center"
            style={{ fontSize: "0.8rem", fontWeight: 500, color: t.sage, backgroundColor: t.bgSecondary }}>
            Открыть трекер →
          </button>
        </motion.div>
      )}

      {/* ════════════════════════════════ RITUALS ════════════════════════════════ */}
      {activeTab === "rituals" && (
        <motion.div key="rituals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <Sunrise className="w-4 h-4 mx-auto mb-1" style={{ color: "#C4A86C" }} />
              <span className="block" style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>{dailyIntentions.length}</span>
              <span style={{ fontSize: "0.55rem", color: t.textMuted }}>Намерений</span>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <MoonIcon className="w-4 h-4 mx-auto mb-1" style={{ color: "#9B8EC4" }} />
              <span className="block" style={{ fontSize: "1rem", fontWeight: 700, color: t.text }}>{eveningCheckins.length}</span>
              <span style={{ fontSize: "0.55rem", color: t.textMuted }}>Чекинов</span>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: t.bgSecondary }}>
              <span className="block" style={{ fontSize: "1rem", fontWeight: 700, color: t.sage }}>
                {(() => {
                  const ids = new Set(dailyIntentions.map(i => i.date));
                  const cds = new Set(eveningCheckins.map(c => c.date));
                  return [...ids].filter(d => cds.has(d)).length;
                })()}
              </span>
              <span style={{ fontSize: "0.55rem", color: t.textMuted }}>Полных дней</span>
            </div>
          </div>

          {/* 7 day heatmap */}
          <div className="rounded-2xl p-3.5 border mb-5" style={{ backgroundColor: t.card, borderColor: t.border }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, display: "block", marginBottom: 8 }}>Последние 7 дней</span>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => {
                const dd = new Date(); dd.setDate(dd.getDate() - (6 - i));
                const dateStr = dd.toISOString().split("T")[0];
                const hasI = dailyIntentions.some(it => it.date === dateStr);
                const hasC = eveningCheckins.some(c => c.date === dateStr);
                const dayLabel = dd.toLocaleDateString("ru-RU", { weekday: "short" }).slice(0, 2);
                return (
                  <div key={dateStr} className="flex-1 text-center">
                    <span style={{ fontSize: "0.55rem", color: t.textFaint, display: "block", marginBottom: 3 }}>{dayLabel}</span>
                    <div className="flex flex-col gap-1 items-center">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{
                        backgroundColor: hasI ? "#C4A86C20" : t.bgSecondary,
                        border: `1px solid ${hasI ? "#C4A86C35" : t.border}`,
                      }}>
                        {hasI && <span style={{ fontSize: "0.5rem" }}>☀️</span>}
                      </div>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{
                        backgroundColor: hasC ? "#9B8EC420" : t.bgSecondary,
                        border: `1px solid ${hasC ? "#9B8EC435" : t.border}`,
                      }}>
                        {hasC && <span style={{ fontSize: "0.5rem" }}>🌙</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-2 justify-center">
              <div className="flex items-center gap-1">
                <span style={{ fontSize: "0.5rem" }}>☀️</span>
                <span style={{ fontSize: "0.55rem", color: t.textFaint }}>Намерение</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ fontSize: "0.5rem" }}>🌙</span>
                <span style={{ fontSize: "0.55rem", color: t.textFaint }}>Чекин</span>
              </div>
            </div>
          </div>

          {/* Recent reflections */}
          {eveningCheckins.length > 0 && (
            <div>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, display: "block", marginBottom: 8 }}>Недавние рефлексии</span>
              <div className="space-y-2">
                {[...eveningCheckins].reverse().slice(0, 5).map((c) => (
                  <div key={c.date} className="rounded-xl p-3 border" style={{ backgroundColor: t.card, borderColor: t.border }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: t.text }}>
                        {new Date(c.date + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short", weekday: "short" })}
                      </span>
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.55rem", fontWeight: 600, backgroundColor: "#9B8EC415", color: "#9B8EC4" }}>
                        {c.word}
                      </span>
                    </div>
                    {c.good && <p style={{ fontSize: "0.68rem", color: t.sage, lineHeight: 1.4, marginBottom: 2 }}>✦ {c.good}</p>}
                    {c.hard && <p style={{ fontSize: "0.68rem", color: t.terracotta, lineHeight: 1.4 }}>◇ {c.hard}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}