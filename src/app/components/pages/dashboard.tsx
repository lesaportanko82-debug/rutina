import { useState, useMemo, useEffect } from "react";
import { CheckCircle2, Circle, ChevronRight, Grip, Star } from "lucide-react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { getDailyTip } from "../recommendations-engine";
import { MorningIntention, EveningCheckin } from "../daily-rituals";
import { AffirmationCard } from "../affirmations";
import { AuroraHeader, GlassBubble, WaveDivider, FloatingPetals, GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const today = () => new Date().toISOString().split("T")[0];

const greetings = () => {
  const h = new Date().getHours();
  if (h < 6) return "Тихой ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Мягкого вечера";
};

const encouragements = [
  "Каждый маленький шаг — это уже победа",
  "Вы делаете больше, чем кажется",
  "Заботиться о себе — это важно",
  "Всё получится, шаг за шагом",
  "Сегодня — хороший день для маленьких побед",
];

// ─── Tool categories for the drawer ───

interface ToolItem {
  emoji: string;
  label: string;
  path: string;
  color: string;
}

const toolCategories: { title: string; emoji: string; items: ToolItem[] }[] = [
  {
    title: "Спокойствие",
    emoji: "🌿",
    items: [
      { emoji: "🫧", label: "Трекер тревоги", path: "/app/anxiety", color: "#C4876C" },
      { emoji: "💭", label: "Worry Journal", path: "/app/worry", color: "#9B8EC4" },
      { emoji: "🆘", label: "SOS-карточка", path: "/app/sos", color: "#C4876C" },
      { emoji: "🧘‍♀️", label: "Мышечная релаксация", path: "/app/pmr", color: "#C4876C" },
    ],
  },
  {
    title: "Рост",
    emoji: "🌱",
    items: [
      { emoji: "📝", label: "Дневник", path: "/app/journal", color: "#9B8EC4" },
      { emoji: "🌳", label: "Дерево навыков", path: "/app/skills", color: "#C4A86C" },
      { emoji: "🌸", label: "30-дн. челлендж", path: "/app/challenge", color: "#9B8EC4" },
      { emoji: "🎯", label: "Self-Care Бинго", path: "/app/bingo", color: "#8DB596" },
      { emoji: "🧠", label: "Когнитивные ловушки", path: "/app/distortions", color: "#7EA8BE" },
    ],
  },
  {
    title: "Рефлексия",
    emoji: "✨",
    items: [
      { emoji: "📊", label: "Аналитика", path: "/app/stats", color: "#7EA8BE" },
      { emoji: "🎡", label: "Колесо жизни", path: "/app/lifewheel", color: "#C4A86C" },
      { emoji: "📦", label: "Капсула времени", path: "/app/capsule", color: "#B88FA7" },
      { emoji: "🌙", label: "Сон", path: "/app/sleep", color: "#9B8EC4" },
      { emoji: "🔔", label: "Напоминания", path: "/app/notifications", color: "#C4876C" },
    ],
  },
];

// All tool items flat for search/favorites
const allTools: ToolItem[] = toolCategories.flatMap((c) => c.items);

// ─── Tools Drawer ───

function ToolsDrawer({ open, onClose, favoriteTools, onToggleFavorite }: { open: boolean; onClose: () => void; favoriteTools: string[]; onToggleFavorite: (path: string) => void }) {
  const t = useTheme();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 rounded-t-2xl"
            style={{ backgroundColor: t.bg, boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: t.border }} />
            </div>

            <div className="px-4 pb-5">
              {/* Compact grid — all tools as small circles */}
              <div className="grid grid-cols-5 gap-x-1 gap-y-2.5 py-1">
                {toolCategories.flatMap((cat) =>
                  cat.items.map((item) => {
                    const isFav = favoriteTools.includes(item.path);
                    return (
                      <motion.button
                        key={item.path}
                        className="flex flex-col items-center gap-0.5"
                        whileTap={{ scale: 0.88 }}
                        onClick={() => { navigate(item.path); onClose(); }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onToggleFavorite(item.path);
                          if (navigator.vibrate) navigator.vibrate(30);
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center relative"
                          style={{
                            backgroundColor: item.color + (isFav ? "18" : "0C"),
                            border: isFav ? `1.5px solid ${item.color}40` : `1px solid ${item.color}15`,
                          }}
                        >
                          <AppIcon icon={item.emoji} size={19} color={item.color} />
                          {isFav && (
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center" style={{ backgroundColor: "#C4A86C" }}>
                              <Star className="w-2 h-2 text-white" style={{ fill: "white" }} />
                            </div>
                          )}
                        </div>
                        <span style={{
                          fontSize: "0.52rem", fontWeight: 500, color: t.textMuted,
                          lineHeight: 1.15, textAlign: "center", maxWidth: 52,
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical" as const,
                        }}>
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Dashboard ───

export function Dashboard() {
  const {
    tasks, habits, moods, profile, toggleTask, toggleHabitToday, questionnaire,
    pomodoroStats, anxietyEntries,
    setDailyIntention, getTodayIntention, saveEveningCheckin, getTodayCheckin,
    focusHabit, capsules,
    favoriteTools, setFavoriteTools,
    darkMode,
  } = useApp();
  const t = useTheme();
  const navigate = useNavigate();
  const d = today();

  const [toolsOpen, setToolsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load avatar on mount (same logic as profile page)
  useEffect(() => {
    const cached = localStorage.getItem("routine_avatar_url");
    if (cached) setAvatarUrl(cached);
  }, []);

  const todayTasks = tasks.filter((tk) => !tk.completed).slice(0, 3);
  const completedToday = tasks.filter((tk) => tk.completed).length;
  const totalTasks = tasks.length;
  const todayMood = moods.find((m) => m.date === d);
  const encouragement = useMemo(() => encouragements[Math.floor(Math.random() * encouragements.length)], []);
  const displayName = questionnaire.filled && questionnaire.name ? questionnaire.name : profile.name;

  const dailyTip = useMemo(
    () => getDailyTip({ questionnaire, tasks, habits, moods, profile, pomodoroStats }),
    [questionnaire, tasks.length, habits.length, moods.length, profile.level, pomodoroStats.totalSessions]
  );

  // Determine contextual block based on time of day
  const timeContext = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return "morning";
    if (h >= 20 || h < 5) return "evening";
    return "day";
  }, []);

  const todayIntention = getTodayIntention();
  const todayCheckin = getTodayCheckin();

  // Capsule notification
  const pendingCapsules = capsules.filter((c) => !c.opened && c.openDate <= d).length;

  const toggleFavorite = (path: string) => {
    setFavoriteTools(
      favoriteTools.includes(path)
        ? favoriteTools.filter((p) => p !== path)
        : favoriteTools.length < 4 ? [...favoriteTools, path] : favoriteTools
    );
  };

  // Habit completion stats for glass bubbles
  const habitsCompletedToday = habits.filter(h => h.completedDates.includes(d)).length;
  const currentStreak = profile.streak || 0;

  return (
    <div className="relative px-5 pt-0 pb-8">
      {/* ─── Aurora gradient header ─── */}
      <AuroraHeader
        darkMode={darkMode}
        colors={timeContext === "evening"
          ? ["#9B8EC4", "#7EA8BE", "#B88FA7"]
          : timeContext === "morning"
            ? ["#C4A86C", "#8DB596", "#7EA8BE"]
            : ["#8DB596", "#9B8EC4", "#7EA8BE"]}
        height={200}
      />

      {/* ─── Floating petals ─── */}
      <FloatingPetals darkMode={darkMode} />

      <div className="relative z-[1] pt-12">
      {/* ─── Header: minimal ─── */}
      <motion.div
        className="flex items-center justify-between mb-5"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <p style={{ fontSize: "0.82rem", color: t.textMuted }}>{greetings()}</p>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1.2, color: t.text }}>
            {displayName}
          </h1>
        </div>
        <motion.button
          onClick={() => navigate("/app/profile")}
          className="w-11 h-11 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #8DB596, #7BAFB0)",
            boxShadow: "0 4px 15px rgba(141,181,150,0.25)",
          }}
          whileTap={{ scale: 0.9 }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Аватар"
              className="w-full h-full object-cover"
              onError={() => setAvatarUrl(null)}
            />
          ) : (
            <>
              {/* Glass shine overlay */}
              <div className="absolute inset-0 rounded-full" style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)",
              }} />
              <span className="text-white relative" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                {profile.level}
              </span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* ─── One gentle encouragement ─── */}
      <motion.p
        style={{ fontSize: "0.75rem", color: t.textFaint, fontStyle: "italic", marginBottom: 16, lineHeight: 1.5 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {encouragement}
      </motion.p>

      {/* ─── Glass stat bubbles row ─── */}
      <motion.div
        className="flex gap-2 mb-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <GlassBubble
          emoji="✅"
          value={`${completedToday}/${totalTasks}`}
          label="Задач"
          color="#8DB596"
          darkMode={darkMode}
          onClick={() => navigate("/app/tasks")}
        />
        <GlassBubble
          emoji={todayMood ? "😊" : "🫧"}
          value={todayMood ? todayMood.mood : "—"}
          label="Настроение"
          color="#9B8EC4"
          darkMode={darkMode}
          onClick={() => navigate("/app/mood")}
        />
        <GlassBubble
          emoji="🌿"
          value={`${habitsCompletedToday}/${habits.length}`}
          label="Привычки"
          color="#7EA8BE"
          darkMode={darkMode}
          onClick={() => navigate("/app/habits")}
        />
        <GlassBubble
          emoji="🔥"
          value={currentStreak}
          label="Стрик"
          color="#C4876C"
          darkMode={darkMode}
          onClick={() => navigate("/app/profile")}
        />
      </motion.div>

      {/* ─── Favorite shortcuts ─── */}
      {favoriteTools.length > 0 && (
        <motion.div className="flex gap-2 mb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
          {favoriteTools.map((path) => {
            const tool = allTools.find((t) => t.path === path);
            if (!tool) return null;
            return (
              <motion.button
                key={path}
                className="flex-1 py-2.5 rounded-xl border flex flex-col items-center gap-1"
                style={{ borderColor: tool.color + "25", backgroundColor: tool.color + "08" }}
                onClick={() => navigate(path)}
                whileTap={{ scale: 0.95 }}
              >
                <AppIcon icon={tool.emoji} size={18} color={tool.color} />
                <span style={{ fontSize: "0.58rem", fontWeight: 500, color: t.textMuted, lineHeight: 1.2, textAlign: "center" }}>
                  {tool.label.split(" ")[0]}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* ─── Questionnaire nudge ─── */}
      {!questionnaire.filled && (
        <motion.button
          className="w-full rounded-2xl p-3.5 mb-4 flex items-center gap-3 border"
          style={{ backgroundColor: t.bgSecondary, borderColor: t.border }}
          onClick={() => navigate("/app/profile")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          whileTap={{ scale: 0.98 }}
        >
          <span style={{ fontSize: "1.2rem" }}>📝</span>
          <div className="flex-1 text-left">
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>Расскажите о себе</span>
            <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Персонализируем приложение под вас</p>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: t.textFaint }} />
        </motion.button>
      )}

      {/* ─── Contextual block: morning intention OR mood OR evening checkin ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4"
      >
        {timeContext === "morning" && !todayIntention && (
          <MorningIntention todayIntention={null} onSave={setDailyIntention} />
        )}
        {timeContext === "morning" && todayIntention && !todayMood && (
          <motion.button
            className="w-full rounded-2xl p-4 flex items-center gap-3 border"
            style={{ backgroundColor: t.bgSecondary, borderColor: t.border }}
            onClick={() => navigate("/app/mood")}
            whileTap={{ scale: 0.98 }}
          >
            <span style={{ fontSize: "1.3rem" }}>😊</span>
            <div className="flex-1 text-left">
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>Как вы себя чувствуете?</span>
              <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Отмет��те настроение — это занимает 10 секунд</p>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: t.textFaint }} />
          </motion.button>
        )}
        {timeContext === "evening" && !todayCheckin && (
          <EveningCheckin todayCheckin={null} onSave={saveEveningCheckin} />
        )}
        {timeContext === "day" && !todayMood && (
          <motion.button
            className="w-full rounded-2xl p-4 flex items-center gap-3 border"
            style={{ backgroundColor: t.bgSecondary, borderColor: t.border }}
            onClick={() => navigate("/app/mood")}
            whileTap={{ scale: 0.98 }}
          >
            <span style={{ fontSize: "1.3rem" }}>😊</span>
            <div className="flex-1 text-left">
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>Как вы себя чувствуете?</span>
              <p style={{ fontSize: "0.7rem", color: t.textMuted }}>Отметьте настроение — это занимает 10 секунд</p>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: t.textFaint }} />
          </motion.button>
        )}
      </motion.div>

      {/* ─── Today's mood (if set) — small inline ─── */}
      {todayMood && (
        <motion.div
          className="rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-2.5"
          style={{ backgroundColor: todayMood.color + "0D", border: `1px solid ${todayMood.color}20` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: todayMood.color, opacity: 0.6 }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 500, color: t.text }}>{todayMood.mood}</span>
          <span style={{ fontSize: "0.7rem", color: t.textMuted, marginLeft: "auto" }}>
            {"✦".repeat(todayMood.energy)}{"○".repeat(5 - todayMood.energy)}
          </span>
        </motion.div>
      )}

      {/* ─── Today intention reminder (if set and daytime) ─── */}
      {todayIntention && timeContext !== "morning" && (
        <motion.div
          className="rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-2.5"
          style={{ backgroundColor: "#C4A86C0D", border: "1px solid #C4A86C20" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          <span style={{ fontSize: "0.75rem" }}>☀️</span>
          <span style={{ fontSize: "0.75rem", color: t.textSecondary, fontStyle: "italic" }}>
            {todayIntention.text}
          </span>
        </motion.div>
      )}

      {/* ─── Focus habit (if set) — compact ─── */}
      {focusHabit.habitId && (() => {
        const fh = habits.find((h) => h.id === focusHabit.habitId);
        if (!fh) return null;
        const doneToday = fh.completedDates.includes(d);
        if (doneToday) return null; // Don't nag if done
        return (
          <motion.div className="rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-2.5"
            style={{ backgroundColor: "#C4A86C0D", border: "1px solid #C4A86C20" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <AppIcon icon={fh.icon} size={18} color={fh.color} />
            <div className="flex-1 min-w-0">
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: t.text }}>{fh.title}</span>
              <span style={{ fontSize: "0.65rem", color: t.textMuted, marginLeft: 6 }}>Стрик: {fh.streak}</span>
            </div>
            <button onClick={() => toggleHabitToday(fh.id)} className="px-2.5 py-1.5 rounded-lg"
              style={{ backgroundColor: t.sage + "18", fontSize: "0.7rem", fontWeight: 600, color: t.sage }}>
              ✓
            </button>
          </motion.div>
        );
      })()}

      {/* ─── Capsule notification ─── */}
      {pendingCapsules > 0 && (
        <motion.button className="w-full rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-2.5 border"
          style={{ backgroundColor: "#B88FA70D", borderColor: "#B88FA720" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
          onClick={() => navigate("/capsule")} whileTap={{ scale: 0.98 }}>
          <motion.span style={{ fontSize: "1rem" }} animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
            📦
          </motion.span>
          <span style={{ fontSize: "0.78rem", fontWeight: 500, color: t.text }}>Капсула ждёт вас</span>
          <ChevronRight className="w-4 h-4 ml-auto" style={{ color: t.textFaint }} />
        </motion.button>
      )}

      {/* ─── Habits — compact row ─── */}
      {habits.length > 0 && (
        <motion.div className="mb-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-2.5">
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>Привычки</span>
            <button onClick={() => navigate("/app/habits")} style={{ fontSize: "0.75rem", fontWeight: 500, color: t.sage }}>Все →</button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            {habits.slice(0, 6).map((habit) => {
              const doneToday = habit.completedDates.includes(d);
              return (
                <motion.button
                  key={habit.id}
                  className="shrink-0 w-14 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all"
                  style={{
                    borderColor: doneToday ? "#8DB59640" : (darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)"),
                    backgroundColor: doneToday ? "#8DB59612" : (darkMode ? "rgba(36,34,32,0.5)" : "rgba(255,255,255,0.45)"),
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                  onClick={() => toggleHabitToday(habit.id)}
                  whileTap={{ scale: 0.9 }}
                >
                  <AppIcon icon={habit.icon} size={20} color={habit.color} />
                  {doneToday && <CheckCircle2 className="w-3 h-3" style={{ color: t.sage }} />}
                  {!doneToday && <span style={{ fontSize: "0.5rem", color: t.textFaint }}>·</span>}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ─── Tasks — minimal ─── */}
      <motion.div className="mb-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-2.5">
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text }}>
            Задачи
            {totalTasks > 0 && (
              <span style={{ fontSize: "0.7rem", fontWeight: 400, color: t.textMuted, marginLeft: 6 }}>
                {completedToday}/{totalTasks}
              </span>
            )}
          </span>
          <button onClick={() => navigate("/app/tasks")} style={{ fontSize: "0.75rem", fontWeight: 500, color: t.sage }}>Все →</button>
        </div>

        {/* Thin progress bar */}
        {totalTasks > 0 && (
          <div className="w-full rounded-full h-1.5 mb-3" style={{ backgroundColor: t.border }}>
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: "linear-gradient(90deg, #8DB596, #7BAFB0)" }}
              initial={{ width: 0 }}
              animate={{ width: `${totalTasks > 0 ? (completedToday / totalTasks) * 100 : 0}%` }}
              transition={{ delay: 0.4, duration: 0.6 }}
            />
          </div>
        )}

        <div className="space-y-1.5">
          {todayTasks.length === 0 && (
            <p style={{ fontSize: "0.78rem", color: t.textFaint, textAlign: "center", padding: "12px 0" }}>
              Всё сделано — заслуженный покой 🌿
            </p>
          )}
          {todayTasks.map((task) => {
            const priorityColors: Record<string, string> = { high: "#C4876C", medium: "#C4A86C", low: "#8DB596" };
            return (
              <motion.div
                key={task.id}
                className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                style={{
                  backgroundColor: darkMode ? "rgba(36,34,32,0.5)" : "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)"}`,
                  boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                <button onClick={() => toggleTask(task.id)}>
                  <Circle className="w-4.5 h-4.5" style={{ color: t.textFaint }} />
                </button>
                <span className="flex-1 min-w-0 truncate" style={{ fontSize: "0.82rem", fontWeight: 500, color: t.text }}>
                  {task.title}
                </span>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: priorityColors[task.priority] || t.textFaint }} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Affirmation — single quiet line ─── */}
      <motion.div className="mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <AffirmationCard
          energy={todayMood ? todayMood.energy : null}
          anxietyLevel={anxietyEntries.length > 0 ? anxietyEntries[0].level : null}
          mood={todayMood ? todayMood.mood : null}
        />
      </motion.div>

      {/* ─── Daily tip — minimal ─── */}
      <motion.div
        className="rounded-xl px-3.5 py-3 mb-5 flex items-start gap-2.5"
        style={{
          backgroundColor: darkMode ? "rgba(36,34,32,0.5)" : "rgba(255,255,255,0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)"}`,
          boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38 }}
      >
        <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>💡</span>
        <p style={{ fontSize: "0.72rem", color: t.textMuted, lineHeight: 1.5 }}>{dailyTip}</p>
      </motion.div>

      {/* ─── "All Tools" button ─── */}
      <motion.button
        className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 mb-2"
        style={{
          backgroundColor: darkMode ? "rgba(36,34,32,0.5)" : "rgba(255,255,255,0.45)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)"}`,
          boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setToolsOpen(true)}
      >
        <Grip className="w-4 h-4" style={{ color: t.textMuted }} />
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.textSecondary }}>Все инструменты</span>
      </motion.button>

      <ToolsDrawer open={toolsOpen} onClose={() => setToolsOpen(false)} favoriteTools={favoriteTools} onToggleFavorite={toggleFavorite} />
      </div>{/* close relative z-[1] */}
    </div>
  );
}