import { useMemo } from "react";
import { motion } from "motion/react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

interface SkillNode {
  id: string;
  name: string;
  icon: string;
  color: string;
  level: number; // 0-5
  maxLevel: number;
  xp: number;
  xpToNext: number;
  description: string;
  children: string[];
  unlocked: boolean;
}

interface SkillBranch {
  id: string;
  name: string;
  icon: string;
  color: string;
  nodes: SkillNode[];
}

function computeSkillTree(habits: any[], moods: any[], journalEntries: any[], anxietyEntries: any[], pomodoroStats: any, tasks: any[]): SkillBranch[] {
  const habitCounts: Record<string, number> = {};
  habits.forEach((h) => {
    habitCounts[h.category] = (habitCounts[h.category] || 0) + h.completedDates.length;
  });

  const mindfulnessXP = (habitCounts["mindfulness"] || 0) * 10 + moods.length * 5 + journalEntries.length * 8;
  const fitnessXP = (habitCounts["fitness"] || 0) * 10 + (habitCounts["health"] || 0) * 8;
  const productivityXP = (habitCounts["productivity"] || 0) * 10 + pomodoroStats.totalSessions * 15 + tasks.filter((t: any) => t.completed).length * 5;
  const resilienceXP = anxietyEntries.length * 12 + anxietyEntries.filter((a: any) => a.usedBreathing || a.usedGrounding).length * 20;
  const socialXP = habits.filter((h: any) => ["Позвонить маме", "Журнал благодарности"].includes(h.title)).reduce((s: number, h: any) => s + h.completedDates.length * 10, 0) + journalEntries.length * 3;

  function makeLevel(xp: number): { level: number; xpInLevel: number; xpToNext: number } {
    const thresholds = [0, 50, 150, 350, 700, 1200];
    let level = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= thresholds[i]) { level = i; break; }
    }
    const next = level < 5 ? thresholds[level + 1] : thresholds[5];
    const curr = thresholds[level];
    return { level, xpInLevel: xp - curr, xpToNext: next - curr };
  }

  const branches: SkillBranch[] = [
    {
      id: "mindfulness",
      name: "Осознанность",
      icon: "🧘",
      color: "#9B8EC4",
      nodes: [
        (() => {
          const { level, xpInLevel, xpToNext } = makeLevel(mindfulnessXP);
          return {
            id: "m1", name: "Медитация", icon: "🧘", color: "#9B8EC4",
            level, maxLevel: 5, xp: xpInLevel, xpToNext,
            description: "Практика внимательности",
            children: ["m2"], unlocked: true,
          };
        })(),
        {
          id: "m2", name: "Дневник", icon: "📝", color: "#B88FA7",
          level: Math.min(5, Math.floor(journalEntries.length / 5)),
          maxLevel: 5, xp: journalEntries.length % 5, xpToNext: 5,
          description: "Письменная рефлексия",
          children: ["m3"], unlocked: journalEntries.length >= 1,
        },
        {
          id: "m3", name: "Глубокое дыхание", icon: "🌬️", color: "#7EA8BE",
          level: Math.min(5, Math.floor(anxietyEntries.filter((a: any) => a.usedBreathing).length / 3)),
          maxLevel: 5, xp: 0, xpToNext: 3,
          description: "Мастерство дыхательных техник",
          children: [], unlocked: mindfulnessXP >= 50,
        },
      ],
    },
    {
      id: "fitness",
      name: "Движение",
      icon: "💪",
      color: "#C4876C",
      nodes: [
        (() => {
          const { level, xpInLevel, xpToNext } = makeLevel(fitnessXP);
          return {
            id: "f1", name: "Тренировка", icon: "💪", color: "#C4876C",
            level, maxLevel: 5, xp: xpInLevel, xpToNext,
            description: "Физическая активность",
            children: ["f2"], unlocked: true,
          };
        })(),
        {
          id: "f2", name: "Здоровье", icon: "❤️", color: "#B8696C",
          level: Math.min(5, Math.floor((habitCounts["health"] || 0) / 7)),
          maxLevel: 5, xp: 0, xpToNext: 7,
          description: "Забота о теле",
          children: ["f3"], unlocked: fitnessXP >= 30,
        },
        {
          id: "f3", name: "Выносливость", icon: "🏔️", color: "#A3907A",
          level: Math.min(5, Math.floor(fitnessXP / 200)),
          maxLevel: 5, xp: 0, xpToNext: 200,
          description: "Долгосрочная стойкость",
          children: [], unlocked: fitnessXP >= 150,
        },
      ],
    },
    {
      id: "productivity",
      name: "Продуктивность",
      icon: "🎯",
      color: "#7EA8BE",
      nodes: [
        (() => {
          const { level, xpInLevel, xpToNext } = makeLevel(productivityXP);
          return {
            id: "p1", name: "Фокус", icon: "🎯", color: "#7EA8BE",
            level, maxLevel: 5, xp: xpInLevel, xpToNext,
            description: "Концентрация и задачи",
            children: ["p2"], unlocked: true,
          };
        })(),
        {
          id: "p2", name: "Помидоро", icon: "🍅", color: "#C4876C",
          level: Math.min(5, Math.floor(pomodoroStats.totalSessions / 10)),
          maxLevel: 5, xp: pomodoroStats.totalSessions % 10, xpToNext: 10,
          description: "Техника помидоро",
          children: ["p3"], unlocked: pomodoroStats.totalSessions >= 1,
        },
        {
          id: "p3", name: "Мастер задач", icon: "✅", color: "#8DB596",
          level: Math.min(5, Math.floor(tasks.filter((t: any) => t.completed).length / 20)),
          maxLevel: 5, xp: 0, xpToNext: 20,
          description: "Систематическое выполнение",
          children: [], unlocked: productivityXP >= 100,
        },
      ],
    },
    {
      id: "resilience",
      name: "Стойкость",
      icon: "🛡️",
      color: "#C4A86C",
      nodes: [
        (() => {
          const { level, xpInLevel, xpToNext } = makeLevel(resilienceXP);
          return {
            id: "r1", name: "Самопознание", icon: "🔍", color: "#C4A86C",
            level, maxLevel: 5, xp: xpInLevel, xpToNext,
            description: "Понимание своих эмоций",
            children: ["r2"], unlocked: true,
          };
        })(),
        {
          id: "r2", name: "Антитревога", icon: "🛡️", color: "#7BAFB0",
          level: Math.min(5, Math.floor(anxietyEntries.filter((a: any) => a.usedBreathing || a.usedGrounding).length / 5)),
          maxLevel: 5, xp: 0, xpToNext: 5,
          description: "Инструменты против тревоги",
          children: ["r3"], unlocked: anxietyEntries.length >= 3,
        },
        {
          id: "r3", name: "Заземление", icon: "🖐️", color: "#8DB596",
          level: Math.min(5, Math.floor(anxietyEntries.filter((a: any) => a.usedGrounding).length / 3)),
          maxLevel: 5, xp: 0, xpToNext: 3,
          description: "Техника 5-4-3-2-1",
          children: [], unlocked: resilienceXP >= 60,
        },
      ],
    },
    {
      id: "social",
      name: "Связи",
      icon: "💕",
      color: "#B88FA7",
      nodes: [
        (() => {
          const { level, xpInLevel, xpToNext } = makeLevel(socialXP);
          return {
            id: "s1", name: "Эмпатия", icon: "💕", color: "#B88FA7",
            level, maxLevel: 5, xp: xpInLevel, xpToNext,
            description: "Связь с другими",
            children: ["s2"], unlocked: true,
          };
        })(),
        {
          id: "s2", name: "Благодарность", icon: "🙏", color: "#C4A86C",
          level: Math.min(5, Math.floor(journalEntries.length / 7)),
          maxLevel: 5, xp: 0, xpToNext: 7,
          description: "Практика благодарности",
          children: [], unlocked: socialXP >= 20,
        },
      ],
    },
  ];

  return branches;
}

const levelNames = ["Новичок", "Ученик", "Практик", "Мастер", "Эксперт", "Легенда"];
const levelStars = ["", "⭐", "⭐⭐", "⭐⭐⭐", "🌟🌟", "👑"];

export function SkillTreePage() {
  const { habits, moods, journalEntries, anxietyEntries, pomodoroStats, tasks } = useApp();
  const t = useTheme();
  const navigate = useNavigate();

  const branches = useMemo(
    () => computeSkillTree(habits, moods, journalEntries, anxietyEntries, pomodoroStats, tasks),
    [habits, moods, journalEntries, anxietyEntries, pomodoroStats, tasks]
  );

  const totalLevel = useMemo(() =>
    branches.reduce((s, b) => s + b.nodes.reduce((ns, n) => ns + n.level, 0), 0),
    [branches]
  );

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl" style={{ backgroundColor: t.bgSecondary }}>
          <ArrowLeft className="w-5 h-5" style={{ color: t.text }} />
        </button>
        <div className="flex-1">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: t.text }}>Древо навыков</h1>
          <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Прокачивай ветки через привычки и действия</p>
        </div>
        <div className="px-3 py-1.5 rounded-full" style={{ backgroundColor: t.gold + "18" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: t.gold }}>LVL {totalLevel}</span>
        </div>
      </div>

      {/* Branches */}
      <div className="space-y-4 mt-4">
        {branches.map((branch, bIdx) => (
          <motion.div
            key={branch.id}
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: t.card, borderColor: t.border }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: bIdx * 0.08 }}
          >
            {/* Branch header */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${t.border}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: branch.color + "18" }}>
                <AppIcon icon={branch.icon} size={20} color={branch.color} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: t.text }}>{branch.name}</p>
                <p style={{ fontSize: "0.65rem", color: t.textFaint }}>
                  {branch.nodes.reduce((s, n) => s + n.level, 0)} / {branch.nodes.length * 5} уровней
                </p>
              </div>
            </div>

            {/* Nodes */}
            <div className="px-4 py-3 space-y-3">
              {branch.nodes.map((node, nIdx) => {
                const progress = node.xpToNext > 0 ? Math.min(node.xp / node.xpToNext, 1) : 1;
                return (
                  <motion.div
                    key={node.id}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: node.unlocked ? 1 : 0.4, x: 0 }}
                    transition={{ delay: bIdx * 0.08 + nIdx * 0.05 }}
                  >
                    {/* Connection line */}
                    {nIdx > 0 && (
                      <div className="w-0.5 h-4 absolute" style={{
                        backgroundColor: node.unlocked ? branch.color + "40" : t.border,
                        marginTop: -20,
                        marginLeft: 19,
                      }} />
                    )}

                    {/* Node icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: node.unlocked ? node.color + "18" : t.bgSecondary,
                        border: `2px solid ${node.unlocked ? node.color + "40" : t.border}`,
                      }}>
                      <span style={{ fontSize: "1rem", filter: node.unlocked ? "none" : "grayscale(1)" }}>
                        <AppIcon icon={node.icon} size={18} color={node.unlocked ? node.color : undefined} />
                      </span>
                    </div>

                    {/* Node info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p style={{
                          fontSize: "0.8rem", fontWeight: 600,
                          color: node.unlocked ? t.text : t.textFaint,
                        }}>
                          {node.name}
                        </p>
                        <span style={{ fontSize: "0.6rem", color: node.color, fontWeight: 600 }}>
                          {node.unlocked ? levelNames[node.level] : "🔒"}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.62rem", color: t.textFaint }}>{node.description}</p>

                      {node.unlocked && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: t.border }}>
                            <motion.div className="h-1.5 rounded-full"
                              style={{ backgroundColor: node.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress * 100}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                          <span style={{ fontSize: "0.55rem", color: t.textFaint, whiteSpace: "nowrap" }}>
                            Ур.{node.level}/{node.maxLevel}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Level stars */}
                    {node.unlocked && node.level > 0 && (
                      <span style={{ fontSize: "0.6rem" }}>{levelStars[node.level]}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <motion.div className="rounded-2xl p-4 mt-4 border" style={{ backgroundColor: t.card, borderColor: t.border }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 600, color: t.text, marginBottom: 8 }}>Как прокачивать</p>
        <div className="space-y-2">
          {[
            { icon: "🧘", text: "Осознанность — медитация, дневник, настроение" },
            { icon: "💪", text: "Движение — тренировки, здоровые привычки" },
            { icon: "🎯", text: "Продуктивность — задачи, помидоро, чтение" },
            { icon: "🛡️", text: "Стойкость — трекер тревоги, дыхание, заземление" },
            { icon: "💕", text: "Связи — благодарности, звонки, дневник" },
          ].map((item) => (
            <div key={item.icon} className="flex items-center gap-2">
              <AppIcon icon={item.icon} size={14} />
              <span style={{ fontSize: "0.68rem", color: t.textMuted }}>{item.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}