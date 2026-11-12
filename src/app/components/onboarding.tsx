import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { useApp } from "./app-context";
import {
  Home, ListChecks, Repeat, Smile, BarChart3, Timer, User,
  Sparkles, ChevronRight, ChevronLeft, Star, Target,
  Heart, Zap, Trophy, BookOpen, Bell, ArrowRight,
  CheckCircle2, Circle, Flame, Palette,
} from "lucide-react";

/* ─── Colors ─── */
const C = {
  bg: "#FAF8F5",
  sage: "#8DB596",
  lavender: "#9B8EC4",
  terracotta: "#C4876C",
  dustyBlue: "#7EA8BE",
  gold: "#C4A86C",
  teal: "#7BAFB0",
  rose: "#B88FA7",
  text: "#4A4540",
  textMuted: "#9B9489",
  textFaint: "#B5AFA6",
  card: "#F5F0E8",
  border: "#E8E3DC",
};

/* ─── Slide: Welcome ─── */
function WelcomeSlide({ active }: { active: boolean }) {
  return (
    <div className="text-center flex flex-col items-center justify-center px-2">
      <motion.div
        className="relative w-32 h-32 rounded-full flex items-center justify-center mb-8"
        style={{ background: `linear-gradient(135deg, ${C.sage}20, ${C.teal}20)` }}
        animate={active ? { scale: [0.85, 1.05, 1] } : {}}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <span style={{ fontSize: "4rem" }}>🌿</span>
        {active && [0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: [C.sage, C.lavender, C.terracotta, C.dustyBlue, C.gold][i] }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1.2, 0],
              x: [0, Math.cos((i * 72 * Math.PI) / 180) * 65],
              y: [0, Math.sin((i * 72 * Math.PI) / 180) * 65],
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </motion.div>
      <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: "-0.3px" }}>
        Добро пожаловать!
      </h1>
      <p style={{ fontSize: "0.95rem", color: C.textMuted, lineHeight: 1.65, maxWidth: 300 }}>
        Ваше пространство для заботы о себе — привычки, задачи, настроение и рост. Без давления, в вашем ритме.
      </p>
      <motion.div
        className="flex items-center gap-2 mt-8 px-5 py-3 rounded-2xl"
        style={{ backgroundColor: C.sage + "12", border: `1px solid ${C.sage}25` }}
        initial={{ opacity: 0, y: 15 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6 }}
      >
        <Sparkles className="w-4 h-4" style={{ color: C.sage }} />
        <span style={{ fontSize: "0.78rem", color: C.sage, fontWeight: 500 }}>
          Давайте познакомимся с приложением
        </span>
      </motion.div>
    </div>
  );
}

/* ─── Slide: Dashboard ─── */
function DashboardSlide({ active }: { active: boolean }) {
  const xpWidth = useMotionValue(0);

  useEffect(() => {
    if (active) {
      animate(xpWidth, 65, { duration: 1.5, delay: 0.4 });
    } else {
      xpWidth.set(0);
    }
  }, [active, xpWidth]);

  const xpPercent = useTransform(xpWidth, (v) => `${v}%`);

  return (
    <div className="text-center px-2">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
        style={{ backgroundColor: C.sage + "18" }}
        animate={active ? { rotate: [0, -5, 5, 0] } : {}}
        transition={{ duration: 0.8 }}
      >
        <Home className="w-7 h-7" style={{ color: C.sage }} />
      </motion.div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>
        Главная панель
      </h2>
      <p style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: 20 }}>
        Всё самое важное на одном экране
      </p>

      {/* Demo XP card */}
      <motion.div
        className="rounded-2xl p-4 mb-3 text-left border"
        style={{ backgroundColor: C.card, borderColor: C.border }}
        initial={{ opacity: 0, y: 15 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "1.2rem" }}>🌰</span>
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: C.text }}>Семечко</span>
              <span className="ml-1.5" style={{ fontSize: "0.62rem", color: C.textFaint }}>Уровень 0</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3" style={{ color: C.gold }} />
            <span style={{ fontSize: "0.68rem", color: C.gold, fontWeight: 600 }}>0 XP</span>
          </div>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: C.border }}>
          <motion.div
            className="h-2 rounded-full"
            style={{ width: xpPercent, background: `linear-gradient(90deg, ${C.sage}, ${C.teal})` }}
          />
        </div>
        <p className="mt-2" style={{ fontSize: "0.62rem", color: C.textFaint }}>
          Выполняйте задачи и привычки — получайте XP и растите от Семечка до Легенды!
        </p>
      </motion.div>

      {/* Key features */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: "📊", label: "Прогресс дня", delay: 0.3 },
          { icon: "📈", label: "Еженедельный отчёт", delay: 0.4 },
          { icon: "💡", label: "Рекомендации", delay: 0.5 },
        ].map((item) => (
          <motion.div
            key={item.label}
            className="rounded-xl p-3 border"
            style={{ backgroundColor: C.card, borderColor: C.border }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={active ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: item.delay }}
          >
            <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
            <p style={{ fontSize: "0.58rem", color: C.textMuted, marginTop: 4 }}>{item.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide: Tasks ─── */
function TasksSlide({ active }: { active: boolean }) {
  const [demoChecked, setDemoChecked] = useState<number[]>([]);
  const [swiped, setSwiped] = useState(false);

  useEffect(() => {
    if (!active) { setDemoChecked([]); setSwiped(false); return; }
    const t1 = setTimeout(() => setDemoChecked([0]), 1200);
    const t2 = setTimeout(() => setSwiped(true), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active]);

  const tasks = [
    { title: "Утренняя пробежка", cat: "health", pri: "medium" },
    { title: "Подготовить отчёт", cat: "work", pri: "high" },
    { title: "Прочитать главу", cat: "study", pri: "low" },
  ];

  const catColors: Record<string, string> = {
    health: C.sage, work: C.dustyBlue, study: C.lavender,
  };
  const priLabels: Record<string, string> = {
    high: "🔴", medium: "🟡", low: "🟢",
  };

  return (
    <div className="text-center px-2">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
        style={{ backgroundColor: C.dustyBlue + "18" }}
        animate={active ? { y: [0, -5, 0] } : {}}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
      >
        <ListChecks className="w-7 h-7" style={{ color: C.dustyBlue }} />
      </motion.div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>
        Доска задач
      </h2>
      <p style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: 16 }}>
        Чек-листы, подзадачи и приоритеты
      </p>

      {/* Demo tasks */}
      <div className="space-y-2 mb-4">
        {tasks.map((task, i) => (
          <motion.div
            key={task.title}
            className="rounded-xl p-3 flex items-center gap-3 border text-left relative overflow-hidden"
            style={{
              backgroundColor: demoChecked.includes(i) ? catColors[task.cat] + "08" : C.card,
              borderColor: demoChecked.includes(i) ? catColors[task.cat] + "30" : C.border,
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15 + i * 0.1 }}
          >
            {demoChecked.includes(i) ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: catColors[task.cat] }} />
            ) : (
              <Circle className="w-5 h-5 shrink-0" style={{ color: C.textFaint }} />
            )}
            <span style={{
              fontSize: "0.82rem", color: C.text, fontWeight: 500,
              textDecoration: demoChecked.includes(i) ? "line-through" : "none",
              opacity: demoChecked.includes(i) ? 0.5 : 1,
            }}>
              {task.title}
            </span>
            <span className="ml-auto shrink-0" style={{ fontSize: "0.7rem" }}>
              {priLabels[task.pri]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Swipe demo */}
      <motion.div
        className="rounded-xl p-3 border flex items-center gap-3"
        style={{ backgroundColor: swiped ? C.sage + "12" : C.card, borderColor: swiped ? C.sage + "30" : C.border }}
        animate={active ? { x: swiped ? [0, 60, 0] : 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <span style={{ fontSize: "0.75rem", color: C.textMuted }}>
          {swiped ? "✅ Свайп вправо — выполнено!" : "👉 Свайпните для быстрого действия"}
        </span>
      </motion.div>

      {/* Tips */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          { icon: "👆", text: "Нажмите кружок — отметить" },
          { icon: "👈", text: "Свайп влево — удалить" },
          { icon: "👉", text: "Свайп вправо — выполнить" },
          { icon: "🔽", text: "Стрелка — подзадачи" },
        ].map((tip, i) => (
          <motion.div
            key={tip.text}
            className="rounded-lg px-2.5 py-2 text-left"
            style={{ backgroundColor: C.card }}
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 + i * 0.1 }}
          >
            <span style={{ fontSize: "0.62rem", color: C.textMuted }}>
              {tip.icon} {tip.text}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide: Habits ─── */
function HabitsSlide({ active }: { active: boolean }) {
  const [streakAnim, setStreakAnim] = useState(0);

  useEffect(() => {
    if (!active) { setStreakAnim(0); return; }
    const interval = setInterval(() => setStreakAnim((s) => Math.min(s + 1, 7)), 300);
    return () => clearInterval(interval);
  }, [active]);

  const habits = [
    { icon: "🧘", title: "Медитация", streak: 12, color: C.lavender },
    { icon: "📚", title: "Чтение", streak: 5, color: C.dustyBlue },
    { icon: "💪", title: "Тренировка", streak: 3, color: C.terracotta },
    { icon: "💧", title: "Пить воду", streak: 8, color: C.teal },
  ];

  return (
    <div className="text-center px-2">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
        style={{ backgroundColor: C.sage + "18" }}
        animate={active ? { rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <Repeat className="w-7 h-7" style={{ color: C.sage }} />
      </motion.div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>
        Трекер привычек
      </h2>
      <p style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: 16 }}>
        Стрики, тепловая карта и каталог из 32 привычек
      </p>

      {/* Habit cards */}
      <div className="space-y-2 mb-4">
        {habits.map((h, i) => (
          <motion.div
            key={h.title}
            className="rounded-xl p-3 flex items-center gap-3 border text-left"
            style={{ backgroundColor: C.card, borderColor: h.color + "20" }}
            initial={{ opacity: 0, y: 10 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: h.color + "18" }}>
              <span style={{ fontSize: "1.1rem" }}>{h.icon}</span>
            </div>
            <div className="flex-1">
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text }}>{h.title}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="w-3 h-3" style={{ color: C.terracotta }} />
                <span style={{ fontSize: "0.65rem", color: C.terracotta, fontWeight: 600 }}>{h.streak} дней</span>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5" style={{ color: h.color }} />
          </motion.div>
        ))}
      </div>

      {/* Streak animation */}
      <motion.div
        className="rounded-xl p-3 border"
        style={{ backgroundColor: C.card, borderColor: C.border }}
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.6 }}
      >
        <p style={{ fontSize: "0.7rem", color: C.textMuted, marginBottom: 6 }}>Ваша неделя:</p>
        <div className="flex justify-center gap-1.5">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, i) => (
            <motion.div
              key={day}
              className="flex flex-col items-center gap-1"
              initial={{ scale: 0 }}
              animate={active && i < streakAnim ? { scale: 1 } : { scale: 0 }}
              transition={{ type: "spring", stiffness: 400, delay: i * 0.08 }}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: i < streakAnim ? C.sage + "25" : C.border }}
              >
                {i < streakAnim && <span style={{ fontSize: "0.6rem" }}>✓</span>}
              </div>
              <span style={{ fontSize: "0.5rem", color: C.textFaint }}>{day}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Slide: Mood ─── */
function MoodSlide({ active }: { active: boolean }) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  useEffect(() => {
    if (!active) { setSelectedMood(null); return; }
    const t = setTimeout(() => setSelectedMood(2), 1500);
    return () => clearTimeout(t);
  }, [active]);

  const moods = [
    { emoji: "😊", name: "Радость", color: "#D4B896" },
    { emoji: "😌", name: "Спокойствие", color: "#8FAEBB" },
    { emoji: "✨", name: "Энергия", color: "#C4956A" },
    { emoji: "💕", name: "Нежность", color: "#B88FA7" },
    { emoji: "🌊", name: "Тревога", color: "#9B8EC4" },
    { emoji: "🌧️", name: "Грусть", color: "#7EA8BE" },
    { emoji: "🌙", name: "Усталость", color: "#A3ADB8" },
    { emoji: "🍂", name: "Раздражение", color: "#C4876C" },
  ];

  return (
    <div className="text-center px-2">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
        style={{ backgroundColor: C.lavender + "18" }}
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Smile className="w-7 h-7" style={{ color: C.lavender }} />
      </motion.div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>
        Трекер настроения
      </h2>
      <p style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: 16 }}>
        Цветовой круг, уровень энергии и анализ
      </p>

      {/* Mini color wheel */}
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg width={192} height={192} viewBox="0 0 192 192">
          {moods.map((mood, i) => {
            const angle = (i / moods.length) * 360;
            const startAngle = angle - 22.5;
            const endAngle = angle + 22.5;
            const outerR = 85;
            const innerR = 50;
            const toRad = (a: number) => ((a - 90) * Math.PI) / 180;
            const os = { x: 96 + outerR * Math.cos(toRad(startAngle)), y: 96 + outerR * Math.sin(toRad(startAngle)) };
            const oe = { x: 96 + outerR * Math.cos(toRad(endAngle)), y: 96 + outerR * Math.sin(toRad(endAngle)) };
            const ie = { x: 96 + innerR * Math.cos(toRad(endAngle)), y: 96 + innerR * Math.sin(toRad(endAngle)) };
            const is_ = { x: 96 + innerR * Math.cos(toRad(startAngle)), y: 96 + innerR * Math.sin(toRad(startAngle)) };
            const path = `M ${os.x} ${os.y} A ${outerR} ${outerR} 0 0 1 ${oe.x} ${oe.y} L ${ie.x} ${ie.y} A ${innerR} ${innerR} 0 0 0 ${is_.x} ${is_.y} Z`;
            const isSelected = selectedMood === i;
            const midAngle = angle;
            const labelR = (outerR + innerR) / 2;
            const lx = 96 + labelR * Math.cos(toRad(midAngle));
            const ly = 96 + labelR * Math.sin(toRad(midAngle));

            return (
              <g key={i}>
                <path
                  d={path}
                  fill={mood.color + (isSelected ? "40" : "18")}
                  stroke={isSelected ? mood.color : C.border}
                  strokeWidth={isSelected ? 2 : 0.5}
                  style={{ transition: "all 0.3s" }}
                />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" style={{ fontSize: isSelected ? "1.1rem" : "0.9rem", transition: "font-size 0.3s" }}>
                  {mood.emoji}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Center */}
        <AnimatePresence mode="wait">
          {selectedMood !== null && (
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex flex-col items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${moods[selectedMood].color}25, ${moods[selectedMood].color}08)`,
                border: `2px solid ${moods[selectedMood].color}40`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <span style={{ fontSize: "1.5rem" }}>{moods[selectedMood].emoji}</span>
              <span style={{ fontSize: "0.5rem", fontWeight: 600, color: C.text }}>{moods[selectedMood].name}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {[
          { n: "1", text: "Выберите цвет на круге — он отражает ваше настроение", color: C.lavender },
          { n: "2", text: "Укажите уровень энергии от 1 до 5", color: C.gold },
          { n: "3", text: "Получите персональные рекомендации", color: C.sage },
        ].map((step, i) => (
          <motion.div
            key={step.n}
            className="flex items-center gap-3 rounded-xl p-3 text-left"
            style={{ backgroundColor: C.card }}
            initial={{ opacity: 0, x: -15 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 + i * 0.15 }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: step.color + "20" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: step.color }}>{step.n}</span>
            </div>
            <span style={{ fontSize: "0.72rem", color: C.textMuted }}>{step.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide: Extras (Analytics, Pomodoro, Journal, Notifications) ─── */
function ExtrasSlide({ active }: { active: boolean }) {
  const tools = [
    {
      icon: BarChart3,
      title: "Аналитика",
      desc: "Графики продуктивности, сравнение недель, тренды настроения и энергии",
      color: C.terracotta,
      emoji: "📊",
    },
    {
      icon: Timer,
      title: "Помодоро-таймер",
      desc: "25 мин работы + 5 мин отдыха. Плавающий виджет со звуками",
      color: C.gold,
      emoji: "🍅",
    },
    {
      icon: BookOpen,
      title: "Дневник",
      desc: "Записывайте мысли и наблюдения каждый день",
      color: C.dustyBlue,
      emoji: "📓",
    },
    {
      icon: Bell,
      title: "Уведомления",
      desc: "Напоминания о привычках, задачах и отметке настроения",
      color: C.rose,
      emoji: "🔔",
    },
  ];

  return (
    <div className="text-center px-2">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
        style={{ backgroundColor: C.terracotta + "18" }}
        animate={active ? { rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
      >
        <Sparkles className="w-7 h-7" style={{ color: C.terracotta }} />
      </motion.div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>
        И ещё кое-что
      </h2>
      <p style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: 16 }}>
        Дополнительные инструменты для продуктивности
      </p>

      <div className="space-y-2.5">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.title}
            className="rounded-xl p-4 flex items-start gap-3 border text-left"
            style={{ backgroundColor: C.card, borderColor: tool.color + "18" }}
            initial={{ opacity: 0, y: 15 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15 + i * 0.12 }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tool.color + "15" }}>
              <span style={{ fontSize: "1.2rem" }}>{tool.emoji}</span>
            </div>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: C.text }}>{tool.title}</span>
              <p style={{ fontSize: "0.68rem", color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{tool.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide: Gamification ─── */
function GamificationSlide({ active }: { active: boolean }) {
  const tiers = [
    { icon: "🌰", name: "Семечко", level: 0 },
    { icon: "🌱", name: "Росток", level: 1 },
    { icon: "🌿", name: "Побег", level: 3 },
    { icon: "🌸", name: "Цветок", level: 5 },
    { icon: "🌳", name: "Дерево", level: 8 },
    { icon: "🏔️", name: "Хранитель", level: 15 },
    { icon: "🌟", name: "Легенда", level: 25 },
  ];

  return (
    <div className="text-center px-2">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
        style={{ backgroundColor: C.gold + "18" }}
        animate={active ? { y: [0, -6, 0] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Trophy className="w-7 h-7" style={{ color: C.gold }} />
      </motion.div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>
        Система роста
      </h2>
      <p style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: 16 }}>
        Растите от Семечка до Легенды
      </p>

      {/* Tier progression */}
      <div className="relative">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            className="flex items-center gap-3 mb-2.5 relative"
            initial={{ opacity: 0, x: -20 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            {/* Line connector */}
            {i < tiers.length - 1 && (
              <div className="absolute left-5 top-10 w-0.5 h-5" style={{ backgroundColor: C.border }} />
            )}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative z-10"
              style={{ backgroundColor: i === 0 ? C.sage + "20" : C.card, border: `1px solid ${C.border}` }}
            >
              <span style={{ fontSize: "1.15rem" }}>{tier.icon}</span>
            </div>
            <div className="text-left flex-1">
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text }}>{tier.name}</span>
              <span className="ml-2" style={{ fontSize: "0.62rem", color: C.textFaint }}>Ур. {tier.level}+</span>
            </div>
            {i === 0 && (
              <span className="px-2 py-0.5 rounded-full text-white" style={{ fontSize: "0.55rem", fontWeight: 600, backgroundColor: C.sage }}>
                Вы здесь!
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* XP sources */}
      <motion.div
        className="rounded-xl p-3 mt-3 border"
        style={{ backgroundColor: C.card, borderColor: C.border }}
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.9 }}
      >
        <p style={{ fontSize: "0.72rem", fontWeight: 600, color: C.text, marginBottom: 6 }}>Как получать XP:</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { text: "Задача = +20 XP", icon: "✅" },
            { text: "Подзадача = +5 XP", icon: "📌" },
            { text: "Привычка = +15 XP", icon: "🔥" },
            { text: "Настроение = +10 XP", icon: "😊" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ backgroundColor: C.sage + "08" }}>
              <span style={{ fontSize: "0.7rem" }}>{item.icon}</span>
              <span style={{ fontSize: "0.6rem", color: C.textMuted }}>{item.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Slide: Profile & Personalization ─── */
function ProfileSlide({ active }: { active: boolean }) {
  return (
    <div className="text-center flex flex-col items-center justify-center px-2">
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
        style={{ backgroundColor: C.teal + "18" }}
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <User className="w-7 h-7" style={{ color: C.teal }} />
      </motion.div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>
        Профиль и настройки
      </h2>
      <p style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: 16 }}>
        Анкета адаптирует приложение под вас
      </p>

      {/* Questionnaire preview */}
      <motion.div
        className="rounded-2xl p-4 border mb-4 text-left w-full"
        style={{ backgroundColor: C.card, borderColor: C.border }}
        initial={{ opacity: 0, y: 15 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4" style={{ color: C.teal }} />
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>Анкета — 6 шагов</span>
        </div>
        <div className="space-y-2">
          {[
            "Ваши цели и приоритеты",
            "Уровень стресса и сон",
            "Желаемые привычки",
            "Пик продуктивности",
            "Способы расслабления",
            "Стиль поддержки",
          ].map((step, i) => (
            <motion.div
              key={step}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              animate={active ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.35 + i * 0.08 }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: C.teal, fontSize: "0.55rem", fontWeight: 700 }}>
                {i + 1}
              </div>
              <span style={{ fontSize: "0.72rem", color: C.textMuted }}>{step}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Extra features */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {[
          { icon: "🌓", label: "Тёмная тема" },
          { icon: "📤", label: "Экспорт" },
          { icon: "🏆", label: "Достижения" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="rounded-xl p-3 border text-center"
            style={{ backgroundColor: C.card, borderColor: C.border }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={active ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.7 + i * 0.1 }}
          >
            <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
            <p style={{ fontSize: "0.55rem", color: C.textMuted, marginTop: 3 }}>{item.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="mt-5 px-4 py-2.5 rounded-xl"
        style={{ fontSize: "0.72rem", color: "#6B8F71", backgroundColor: C.sage + "08", fontStyle: "italic" }}
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
      >
        💡 На каждой странице вас ждут контекстные подсказки — они помогут быстрее освоиться
      </motion.p>
    </div>
  );
}

/* ─── Slide: Ready ─── */
function ReadySlide({ active }: { active: boolean }) {
  return (
    <div className="text-center flex flex-col items-center justify-center px-2">
      <motion.div
        className="relative w-36 h-36 rounded-full flex items-center justify-center mb-8"
        style={{ background: `linear-gradient(135deg, ${C.sage}15, ${C.lavender}15, ${C.terracotta}15)` }}
        animate={active ? { scale: [0.9, 1.05, 1], rotate: [0, 3, -3, 0] } : {}}
        transition={{ duration: 1.5 }}
      >
        <span style={{ fontSize: "4.5rem" }}>🚀</span>
        {active && [C.sage, C.lavender, C.terracotta, C.dustyBlue, C.gold, C.teal].map((color, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              x: [0, Math.cos((i * 60 * Math.PI) / 180) * 70],
              y: [0, Math.sin((i * 60 * Math.PI) / 180) * 70],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}
      </motion.div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: C.text, marginBottom: 8 }}>
        Всё готово!
      </h1>
      <p style={{ fontSize: "0.92rem", color: C.textMuted, lineHeight: 1.6, maxWidth: 300, marginBottom: 16 }}>
        Вы начинаете как <strong style={{ color: C.sage }}>Семечко 🌰</strong> — каждое действие поможет вам расти
      </p>

      {/* Bottom nav preview */}
      <motion.div
        className="rounded-2xl p-3 border w-full"
        style={{ backgroundColor: C.card, borderColor: C.border }}
        initial={{ opacity: 0, y: 15 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4 }}
      >
        <p style={{ fontSize: "0.68rem", color: C.textFaint, marginBottom: 8 }}>Навигация внизу экрана:</p>
        <div className="flex items-center justify-around">
          {[
            { icon: Home, label: "Главная", color: C.sage },
            { icon: ListChecks, label: "Задачи", color: C.dustyBlue },
            { icon: Repeat, label: "Привычки", color: C.sage },
            { icon: Smile, label: "Настроение", color: C.lavender },
            { icon: User, label: "Профиль", color: C.teal },
          ].map((tab, i) => (
            <motion.div
              key={tab.label}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 8 }}
              animate={active ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              <tab.icon className="w-5 h-5" style={{ color: tab.color }} />
              <span style={{ fontSize: "0.5rem", color: C.textMuted, fontWeight: 500 }}>{tab.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.p
        className="mt-5"
        style={{ fontSize: "0.75rem", color: C.textFaint }}
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
      >
        Заполните анкету в Профиле для персональных советов
      </motion.p>
    </div>
  );
}

/* ─── Slide Components Array ─── */
const slides = [
  { component: WelcomeSlide, label: "Далее" },
  { component: DashboardSlide, label: "Далее" },
  { component: TasksSlide, label: "Далее" },
  { component: HabitsSlide, label: "Далее" },
  { component: MoodSlide, label: "Далее" },
  { component: ExtrasSlide, label: "Далее" },
  { component: GamificationSlide, label: "Далее" },
  { component: ProfileSlide, label: "Далее" },
  { component: ReadySlide, label: "Начать!" },
];

/* ─── Main Onboarding ─── */
export function Onboarding() {
  const { setOnboardingDone } = useApp();
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const finishOnboarding = () => {
    setOnboardingDone();
  };

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const SlideComponent = slides[step].component;
  const progress = ((step + 1) / slides.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: C.bg }}
      ref={containerRef}
    >
      <div className="w-full max-w-[430px] px-5 py-6 flex flex-col min-h-screen relative">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-4">
          {step > 0 && (
            <motion.button
              onClick={handleBack}
              className="p-1.5 rounded-xl"
              style={{ backgroundColor: C.card }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: C.textMuted }} />
            </motion.button>
          )}
          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: C.border }}>
            <motion.div
              className="h-1.5 rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.sage}, ${C.teal})` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span style={{ fontSize: "0.65rem", color: C.textFaint, fontWeight: 500, minWidth: 30, textAlign: "right" }}>
            {step + 1}/{slides.length}
          </span>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="w-full"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <SlideComponent active={true} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 my-4">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full cursor-pointer"
              style={{
                width: step === i ? 20 : 6,
                height: 6,
                backgroundColor: step === i ? C.sage : i < step ? C.sage + "50" : C.border,
              }}
              animate={{ width: step === i ? 20 : 6 }}
              transition={{ duration: 0.3 }}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <motion.button
            className="w-full text-white rounded-2xl py-4 flex items-center justify-center gap-2"
            style={{ fontSize: "1rem", fontWeight: 600, background: `linear-gradient(135deg, ${C.sage}, ${C.teal})` }}
            onClick={handleNext}
            whileTap={{ scale: 0.98 }}
          >
            {slides[step].label}
            {step < slides.length - 1 && <ArrowRight className="w-4 h-4" />}
          </motion.button>
          {step < slides.length - 1 && (
            <button
              className="w-full py-2.5"
              style={{ fontSize: "0.82rem", color: C.textFaint }}
              onClick={() => finishOnboarding()}
            >
              Пропустить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}