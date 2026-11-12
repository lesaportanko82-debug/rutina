import { useState, useMemo } from "react";
import { useApp } from "../app-context";
import { useTheme } from "../theme";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Flame, Trophy, CheckCircle2, X, Sparkles, Trash2, Search, ChevronDown, ChevronUp, Star, Check, Snowflake, Focus, Zap } from "lucide-react";
import { CompassionateCard } from "../compassionate-messages";
import { GlassPanel } from "../ambient-elements";
import { AppIcon } from "../app-icon";

const today = () => new Date().toISOString().split("T")[0];

interface CatalogHabit {
  title: string; icon: string; color: string;
  category: "health" | "productivity" | "mindfulness" | "fitness";
  target: number; description: string; tags: string[];
}

interface CatalogCategory {
  key: string; label: string; icon: string; color: string; bg: string; habits: CatalogHabit[];
}

const habitCatalog: CatalogCategory[] = [
  {
    key: "health", label: "Здоровье", icon: "🌿", color: "#8DB596", bg: "#EDF5EF",
    habits: [
      { title: "Пить воду", icon: "💧", color: "#7BAFB0", category: "health", target: 7, description: "8 стаканов воды в день", tags: ["вода", "здоровье"] },
      { title: "Здоровое питание", icon: "🥗", color: "#8DB596", category: "health", target: 6, description: "Здоровое блюдо каждый день", tags: ["питание"] },
      { title: "Витамины", icon: "💊", color: "#C4A86C", category: "health", target: 7, description: "Принимать витамины", tags: ["витамины"] },
      { title: "Ранний подъём", icon: "🌅", color: "#C4876C", category: "health", target: 5, description: "Вставать до 7:00", tags: ["утро", "режим"] },
      { title: "Сон до 23:00", icon: "🌙", color: "#9B8EC4", category: "health", target: 7, description: "Ложиться вовремя", tags: ["сон"] },
      { title: "Без сахара", icon: "🍬", color: "#C4876C", category: "health", target: 5, description: "Отказаться от сладкого", tags: ["питание"] },
      { title: "Уход за кожей", icon: "✨", color: "#B88FA7", category: "health", target: 7, description: "Утренний и вечерний уход", tags: ["уход"] },
      { title: "Осанка", icon: "🧍", color: "#7EA8BE", category: "health", target: 7, description: "Следить за осанкой", tags: ["осанка"] },
    ],
  },
  {
    key: "fitness", label: "Движение", icon: "🏔️", color: "#C4876C", bg: "#FAF0EB",
    habits: [
      { title: "Тренировка", icon: "💪", color: "#C4876C", category: "fitness", target: 4, description: "30+ минут активной тренировки", tags: ["спорт"] },
      { title: "Прогулка", icon: "🚶", color: "#8DB596", category: "fitness", target: 7, description: "30 минут на свежем воздухе", tags: ["прогулка"] },
      { title: "10 000 шагов", icon: "👣", color: "#C4A86C", category: "fitness", target: 6, description: "Дойти до 10 000 шагов", tags: ["шаги"] },
      { title: "Утренняя зарядка", icon: "🏃", color: "#C4876C", category: "fitness", target: 7, description: "5–10 минут зарядки", tags: ["утро"] },
      { title: "Растяжка", icon: "🤸", color: "#9B8EC4", category: "fitness", target: 5, description: "10 минут растяжки", tags: ["растяжка"] },
      { title: "Йога", icon: "🧘‍♀️", color: "#7BAFB0", category: "fitness", target: 4, description: "Практика йоги", tags: ["йога"] },
      { title: "Плавание", icon: "🏊", color: "#7EA8BE", category: "fitness", target: 3, description: "Плавание", tags: ["плавание"] },
      { title: "Велосипед", icon: "🚴", color: "#C4A86C", category: "fitness", target: 3, description: "Кардио на свежем воздухе", tags: ["велосипед"] },
    ],
  },
  {
    key: "mindfulness", label: "Осознанность", icon: "🧘", color: "#9B8EC4", bg: "#F2EFF8",
    habits: [
      { title: "Медитация", icon: "🧘", color: "#9B8EC4", category: "mindfulness", target: 7, description: "10 минут тишины", tags: ["медитация"] },
      { title: "Журнал благодарности", icon: "📝", color: "#8DB596", category: "mindfulness", target: 7, description: "3 вещи за которые благодарны", tags: ["благодарность"] },
      { title: "Дыхательная практика", icon: "🌬️", color: "#7BAFB0", category: "mindfulness", target: 7, description: "5 минут осознанного дыхания", tags: ["дыхание"] },
      { title: "Без телефона перед сном", icon: "📵", color: "#C4A86C", category: "mindfulness", target: 7, description: "Отложить телефон за час до сна", tags: ["детокс"] },
      { title: "Дневник", icon: "📓", color: "#A3907A", category: "mindfulness", target: 5, description: "Записать мысли за день", tags: ["дневник"] },
      { title: "Цифровой детокс", icon: "🔌", color: "#7EA8BE", category: "mindfulness", target: 3, description: "1 час без экранов", tags: ["детокс"] },
      { title: "Аффирмации", icon: "💬", color: "#B88FA7", category: "mindfulness", target: 7, description: "Позитивные утверждения", tags: ["аффирмации"] },
      { title: "Визуализация", icon: "🌈", color: "#C4A86C", category: "mindfulness", target: 5, description: "5 минут визуализации", tags: ["визуализация"] },
    ],
  },
  {
    key: "productivity", label: "Продуктивность", icon: "📖", color: "#7EA8BE", bg: "#EEF3F6",
    habits: [
      { title: "Чтение", icon: "📚", color: "#7EA8BE", category: "productivity", target: 5, description: "15 минут чтения", tags: ["чтение"] },
      { title: "Изучение языка", icon: "🌍", color: "#C4876C", category: "productivity", target: 5, description: "15 минут практики", tags: ["язык"] },
      { title: "Планирование дня", icon: "📋", color: "#C4A86C", category: "productivity", target: 7, description: "5 минут утром — план на день", tags: ["планирование"] },
      { title: "Подведение итогов", icon: "📊", color: "#9B8EC4", category: "productivity", target: 5, description: "Вечерний обзор дня", tags: ["итоги"] },
      { title: "Фокус-сессия", icon: "🎯", color: "#C4876C", category: "productivity", target: 5, description: "1 час глубокой работы", tags: ["фокус"] },
      { title: "Новый навык", icon: "🧩", color: "#7BAFB0", category: "productivity", target: 3, description: "30 минут на что-то новое", tags: ["навык"] },
      { title: "Inbox Zero", icon: "📧", color: "#A3907A", category: "productivity", target: 5, description: "Обработать все входящие", tags: ["почта"] },
      { title: "Творчество", icon: "🎨", color: "#B88FA7", category: "productivity", target: 3, description: "15 минут творчества", tags: ["творчество"] },
    ],
  },
];

const allCatalogHabits = habitCatalog.flatMap((c) => c.habits);
const categoryLabels: Record<string, string> = {
  health: "🌿 Здоровье", productivity: "📖 Продуктивность", mindfulness: "🧘 Осознанность", fitness: "🏔️ Движение",
};

export function HabitsPage() {
  const { habits, toggleHabitToday, addHabit, deleteHabit, freezeHabitToday, toggleHabitMicroToday, focusHabit, setFocusHabitId, setHabitStack, moods, questionnaire, seenTips, dismissTip, darkMode } = useApp();
  const th = useTheme();
  const [mode, setMode] = useState<"list" | "catalog" | "custom">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<string | null>(null);
  const [selectedCatalogHabits, setSelectedCatalogHabits] = useState<Set<string>>(new Set());

  const [newTitle, setNewTitle] = useState("");
  const [newIcon, setNewIcon] = useState("🎯");
  const [newColor, setNewColor] = useState("#9B8EC4");
  const [newTarget, setNewTarget] = useState(7);
  const [newCategory, setNewCategory] = useState<"health" | "productivity" | "mindfulness" | "fitness">("health");
  const [newMicroVersion, setNewMicroVersion] = useState("");

  const defaultIcons = ["🧘", "📚", "💪", "💧", "🏃", "📝", "🎯", "🌱", "☀️", "🧠", "🎨", "🎵"];
  const defaultColors = ["#9B8EC4", "#7EA8BE", "#C4876C", "#7BAFB0", "#C4A86C", "#8DB596", "#B88FA7", "#A3907A"];

  const d = today();
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const doneToday = habits.filter((h) => h.completedDates.includes(d)).length;
  const existingTitles = useMemo(() => new Set(habits.map((h) => h.title.toLowerCase())), [habits]);

  // Recommended habits from questionnaire
  const recommendedHabits = useMemo(() => {
    if (!questionnaire.filled || !questionnaire.desiredHabits.length) return [];
    const recommended: CatalogHabit[] = [];
    for (const desired of questionnaire.desiredHabits) {
      const found = allCatalogHabits.find(
        (h) => h.title.toLowerCase().includes(desired.toLowerCase()) || desired.toLowerCase().includes(h.title.toLowerCase())
      );
      if (found && !existingTitles.has(found.title.toLowerCase())) {
        recommended.push(found);
      }
    }
    return recommended.slice(0, 4);
  }, [questionnaire, existingTitles]);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery && !selectedCategory) return habitCatalog;
    const q = searchQuery.toLowerCase();
    return habitCatalog
      .map((cat) => ({
        ...cat,
        habits: cat.habits.filter((h) => {
          if (selectedCategory && cat.key !== selectedCategory) return false;
          if (!q) return true;
          return h.title.toLowerCase().includes(q) || h.description.toLowerCase().includes(q) || h.tags.some((tg) => tg.includes(q));
        }),
      }))
      .filter((cat) => cat.habits.length > 0);
  }, [searchQuery, selectedCategory]);

  const handleAddFromCatalog = (habit: CatalogHabit) => {
    if (existingTitles.has(habit.title.toLowerCase())) return;
    addHabit({ title: habit.title, icon: habit.icon, color: habit.color, target: habit.target, category: habit.category });
  };

  const toggleCatalogSelection = (habitTitle: string) => {
    setSelectedCatalogHabits((prev) => {
      const next = new Set(prev);
      if (next.has(habitTitle)) {
        next.delete(habitTitle);
      } else {
        next.add(habitTitle);
      }
      return next;
    });
  };

  const handleSaveSelectedHabits = () => {
    selectedCatalogHabits.forEach((title) => {
      const habit = allCatalogHabits.find((h) => h.title === title);
      if (habit && !existingTitles.has(habit.title.toLowerCase())) {
        addHabit({ title: habit.title, icon: habit.icon, color: habit.color, target: habit.target, category: habit.category });
      }
    });
    setSelectedCatalogHabits(new Set());
    setMode("list");
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const handleAddCustom = () => {
    if (!newTitle.trim()) return;
    addHabit({ title: newTitle.trim(), icon: newIcon, color: newColor, target: newTarget, category: newCategory, microVersion: newMicroVersion.trim() || undefined });
    setNewTitle("");
    setNewMicroVersion("");
    setMode("list");
  };

  // Generate heatmap for last 30 days
  const generateHeatmap = (completedDates: string[]) => {
    const dates: Array<{ date: string; done: boolean; day: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dates.push({ date: dateStr, done: completedDates.includes(dateStr), day: date.getDate() });
    }
    return dates;
  };

  return (
    <div className="px-5 pt-14 pb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: th.text }}>Ваши привычки</h1>
        {mode === "list" ? (
          <motion.button
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: th.sage }}
            onClick={() => setMode("catalog")}
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        ) : (
          <motion.button
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: th.border }}
            onClick={() => { setMode("list"); setSearchQuery(""); setSelectedCategory(null); }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" style={{ color: th.textSecondary }} />
          </motion.button>
        )}
      </div>
      <p style={{ fontSize: "0.78rem", color: th.textMuted, marginBottom: 16 }}>
        {mode === "list" && "Маленькие шаги каждый день — это и есть путь"}
        {mode === "catalog" && "Выберите привычки — мы всё настроим за вас"}
        {mode === "custom" && "Создайте свою уникальную привычку"}
      </p>

      {/* Stats */}
      {mode === "list" && (
        <div className="flex gap-3 mb-5">
          <GlassPanel darkMode={darkMode} color={th.gold} className="flex-1 rounded-2xl p-3 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1" style={{ color: th.gold }} />
            <span className="block" style={{ fontSize: "1.2rem", fontWeight: 700, color: th.text }}>{totalStreak}</span>
            <span style={{ fontSize: "0.65rem", color: th.textMuted }}>Общий стрик</span>
          </GlassPanel>
          <GlassPanel darkMode={darkMode} color={th.sage} className="flex-1 rounded-2xl p-3 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1" style={{ color: th.sage }} />
            <span className="block" style={{ fontSize: "1.2rem", fontWeight: 700, color: th.text }}>{doneToday}/{habits.length}</span>
            <span style={{ fontSize: "0.65rem", color: th.textMuted }}>Сегодня</span>
          </GlassPanel>
          <GlassPanel darkMode={darkMode} color={th.lavender} className="flex-1 rounded-2xl p-3 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1" style={{ color: th.lavender }} />
            <span className="block" style={{ fontSize: "1.2rem", fontWeight: 700, color: th.text }}>
              {Math.max(...habits.map((h) => h.bestStreak), 0)}
            </span>
            <span style={{ fontSize: "0.65rem", color: th.textMuted }}>Лучший стрик</span>
          </GlassPanel>
        </div>
      )}

      {/* Recommended for you */}
      {mode === "list" && recommendedHabits.length > 0 && (
        <motion.div
          className="rounded-2xl p-4 mb-5 border"
          style={{ backgroundColor: th.gold + "10", borderColor: th.gold + "25" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4" style={{ color: th.gold }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: th.text }}>Рекомендуем для вас</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {recommendedHabits.map((habit) => (
              <motion.button
                key={habit.title}
                className="shrink-0 w-20 flex flex-col items-center gap-1 p-3 rounded-xl border"
                style={{ borderColor: th.border, backgroundColor: th.card }}
                onClick={() => handleAddFromCatalog(habit)}
                whileTap={{ scale: 0.9 }}
              >
                <AppIcon icon={habit.icon} size={22} color={habit.color} />
                <span style={{ fontSize: "0.6rem", fontWeight: 500, color: th.textMuted, textAlign: "center", lineHeight: 1.2 }}>
                  {habit.title}
                </span>
                <Plus className="w-3.5 h-3.5" style={{ color: th.sage }} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* CATALOG */}
        {mode === "catalog" && (
          <motion.div key="catalog" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: th.textFaint }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Найти привычку..."
                className="w-full rounded-xl pl-10 pr-4 py-3 border outline-none"
                style={{ fontSize: "0.85rem", backgroundColor: th.inputBg, borderColor: th.borderLight, color: th.text }}
              />
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                className="shrink-0 px-3 py-1.5 rounded-full border"
                style={{
                  fontSize: "0.75rem", fontWeight: 500,
                  borderColor: !selectedCategory ? th.sage : th.borderLight,
                  backgroundColor: !selectedCategory ? th.sage + "18" : th.inputBg,
                  color: !selectedCategory ? "#6B8F71" : th.textMuted,
                }}
                onClick={() => setSelectedCategory(null)}
              >Все</button>
              {habitCatalog.map((cat) => (
                <button
                  key={cat.key}
                  className="shrink-0 px-3 py-1.5 rounded-full border"
                  style={{
                    fontSize: "0.75rem", fontWeight: 500,
                    borderColor: selectedCategory === cat.key ? cat.color : th.borderLight,
                    backgroundColor: selectedCategory === cat.key ? cat.bg : th.inputBg,
                    color: selectedCategory === cat.key ? cat.color : th.textMuted,
                  }}
                  onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                ><AppIcon icon={cat.icon} size={14} color={cat.color} /> {cat.label}</button>
              ))}
            </div>
            {filteredCatalog.map((cat) => (
              <div key={cat.key} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <AppIcon icon={cat.icon} size={18} color={cat.color} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: th.text }}>{cat.label}</span>
                  <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "0.65rem", backgroundColor: cat.bg, color: cat.color, fontWeight: 600 }}>
                    {cat.habits.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {cat.habits.map((habit) => {
                    const alreadyAdded = existingTitles.has(habit.title.toLowerCase());
                    const isSelected = selectedCatalogHabits.has(habit.title);
                    return (
                      <motion.div
                        key={habit.title}
                        className="rounded-xl p-3.5 border flex items-center gap-3 cursor-pointer"
                        style={{
                          backgroundColor: alreadyAdded ? th.bgTertiary : isSelected ? th.sage + "10" : th.card,
                          borderColor: isSelected ? th.sage + "50" : th.border,
                          opacity: alreadyAdded ? 0.7 : 1,
                        }}
                        onClick={() => !alreadyAdded && toggleCatalogSelection(habit.title)}
                        whileTap={!alreadyAdded ? { scale: 0.98 } : undefined}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: habit.color + "18" }}>
                          <AppIcon icon={habit.icon} size={20} color={habit.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: th.text }}>{habit.title}</span>
                          <p style={{ fontSize: "0.68rem", color: th.textMuted, lineHeight: 1.3, marginTop: 1 }}>{habit.description}</p>
                        </div>
                        {alreadyAdded ? (
                          <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: th.sage + "18" }}>
                            <CheckCircle2 className="w-4 h-4" style={{ color: th.sage }} />
                          </div>
                        ) : (
                          <div
                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all"
                            style={{
                              borderColor: isSelected ? th.sage : th.border,
                              backgroundColor: isSelected ? th.sage : "transparent",
                            }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredCatalog.length === 0 && (
              <div className="text-center py-8">
                <span style={{ fontSize: "2rem" }}>🔍</span>
                <p style={{ fontSize: "0.85rem", color: th.textMuted, marginTop: 8 }}>Ничего не найдено</p>
              </div>
            )}
            <motion.button
              className="w-full rounded-2xl p-4 border flex items-center gap-3 mt-2"
              style={{ backgroundColor: th.bgSecondary, borderColor: th.border }}
              onClick={() => setMode("custom")}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: th.border }}>
                <Sparkles className="w-5 h-5" style={{ color: th.gold }} />
              </div>
              <div className="flex-1 text-left">
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: th.text }}>Создать свою привычку</span>
                <p style={{ fontSize: "0.72rem", color: th.textMuted }}>Настройте всё вручную</p>
              </div>
            </motion.button>

            {/* Floating save button */}
            <AnimatePresence>
              {selectedCatalogHabits.size > 0 && (
                <motion.div
                  className="sticky bottom-4 mt-4 z-10"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <motion.button
                    className="w-full text-white rounded-2xl py-4 shadow-lg flex items-center justify-center gap-2"
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      background: `linear-gradient(135deg, #8DB596, #7BAFB0)`,
                      boxShadow: "0 4px 20px rgba(141, 181, 150, 0.4)",
                    }}
                    onClick={handleSaveSelectedHabits}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Сохранить {selectedCatalogHabits.size}{" "}
                    {selectedCatalogHabits.size === 1
                      ? "привычку"
                      : selectedCatalogHabits.size >= 2 && selectedCatalogHabits.size <= 4
                        ? "привычки"
                        : "привычек"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* CUSTOM FORM */}
        {mode === "custom" && (
          <motion.div key="custom" className="rounded-2xl p-4 mb-5 border" style={{ backgroundColor: th.bgSecondary, borderColor: th.border }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Какую привычку хотите развить?..."
              className="w-full rounded-xl px-4 py-3 border outline-none"
              style={{ fontSize: "0.9rem", backgroundColor: th.inputBg, borderColor: th.borderLight, color: th.text }} />
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: th.textMuted, marginTop: 12, marginBottom: 8 }}>Иконка</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {defaultIcons.map((ic) => (
                <button key={ic} className="w-9 h-9 rounded-lg flex items-center justify-center border"
                  style={{ borderColor: newIcon === ic ? th.sage : th.borderLight, backgroundColor: newIcon === ic ? th.sage + "18" : th.inputBg }}
                  onClick={() => setNewIcon(ic)}>
                  <AppIcon icon={ic} size={18} />
                </button>
              ))}
            </div>
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: th.textMuted, marginBottom: 8 }}>Цвет</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {defaultColors.map((c) => (
                <button key={c} className="w-8 h-8 rounded-full border-2"
                  style={{ backgroundColor: c, opacity: 0.75, borderColor: newColor === c ? th.text : "transparent", transform: newColor === c ? "scale(1.1)" : "scale(1)" }}
                  onClick={() => setNewColor(c)} />
              ))}
            </div>
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: th.textMuted, marginBottom: 8 }}>Категория</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((cat) => (
                <button key={cat} className="px-3 py-1.5 rounded-full border"
                  style={{ fontSize: "0.75rem", fontWeight: 500, borderColor: newCategory === cat ? th.sage : th.borderLight, backgroundColor: newCategory === cat ? th.sage + "18" : th.inputBg, color: newCategory === cat ? "#6B8F71" : th.textMuted }}
                  onClick={() => setNewCategory(cat as any)}>
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
            <input type="range" min={1} max={7} value={newTarget} onChange={(e) => setNewTarget(Number(e.target.value))} className="w-full mb-4" style={{ accentColor: th.sage }} />
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: th.textMuted, marginBottom: 8 }}>
              Микро-версия <span style={{ fontWeight: 400, fontStyle: "italic" }}>(необязательно)</span>
            </p>
            <input value={newMicroVersion} onChange={(e) => setNewMicroVersion(e.target.value)} placeholder="Например: 1 приседание вместо 30 мин"
              className="w-full rounded-xl px-4 py-3 border outline-none mb-3"
              style={{ fontSize: "0.9rem", backgroundColor: th.inputBg, borderColor: th.borderLight, color: th.text }} />
            <div className="flex gap-2">
              <motion.button className="flex-1 rounded-xl py-3 border"
                style={{ fontSize: "0.85rem", fontWeight: 600, color: th.textMuted, borderColor: th.borderLight, backgroundColor: th.inputBg }}
                onClick={() => setMode("catalog")} whileTap={{ scale: 0.98 }}>Назад</motion.button>
              <motion.button className="flex-1 text-white rounded-xl py-3"
                style={{ fontSize: "0.85rem", fontWeight: 600, backgroundColor: th.sage }}
                onClick={handleAddCustom} whileTap={{ scale: 0.98 }}>Добавить</motion.button>
            </div>
          </motion.div>
        )}

        {/* LIST */}
        {mode === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Compassionate message */}
            <div className="mb-4">
              <CompassionateCard
                habits={habits}
                moods={moods}
                dismissKey="habits-compassion"
                dismissed={(seenTips || []).includes("habits-compassion")}
                onDismiss={() => dismissTip("habits-compassion")}
              />
            </div>

            <div className="space-y-3">
              {habits.map((habit, i) => {
                const isDoneToday = habit.completedDates.includes(d);
                const isFrozenToday = (habit.frozenDates || []).includes(d);
                const progress = habit.target > 0 ? Math.min(habit.streak / habit.target, 1) : 0;
                const isExpanded = expandedHabit === habit.id;
                const heatmapData = showHeatmap === habit.id ? generateHeatmap(habit.completedDates) : [];

                return (
                  <motion.div key={habit.id} className="rounded-2xl overflow-hidden"
                    style={{
                      background: isFrozenToday
                        ? (darkMode ? `linear-gradient(135deg, rgba(126,168,190,0.08), rgba(36,34,32,0.5))` : `linear-gradient(135deg, rgba(126,168,190,0.1), rgba(255,255,255,0.4))`)
                        : isDoneToday
                          ? (darkMode ? `linear-gradient(135deg, rgba(141,181,150,0.08), rgba(36,34,32,0.5))` : `linear-gradient(135deg, rgba(141,181,150,0.1), rgba(255,255,255,0.4))`)
                          : (darkMode ? `linear-gradient(135deg, rgba(36,34,32,0.7), rgba(36,34,32,0.4))` : `linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.35))`),
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: `1px solid ${isFrozenToday ? th.dustyBlue + "30" : isDoneToday ? th.sage + "30" : (darkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)")}`,
                      boxShadow: darkMode
                        ? "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)"
                        : "0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)",
                    }}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} layout>
                    <div className="p-4 flex items-center gap-3">
                      <motion.button className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isFrozenToday ? th.dustyBlue + "18" : isDoneToday ? th.sage + "18" : habit.color + "15" }}
                        onClick={() => !isFrozenToday && toggleHabitToday(habit.id)} whileTap={{ scale: 0.85 }}>
                        {isFrozenToday ? (
                          <Snowflake className="w-6 h-6" style={{ color: th.dustyBlue }} />
                        ) : isDoneToday ? (
                          <CheckCircle2 className="w-6 h-6" style={{ color: th.sage }} />
                        ) : (
                          <AppIcon icon={habit.icon} size={22} color={habit.color} />
                        )}
                      </motion.button>
                      <div className="flex-1 min-w-0" onClick={() => setExpandedHabit(isExpanded ? null : habit.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: isFrozenToday ? th.dustyBlue : isDoneToday ? "#6B8F71" : th.text }}>
                              {habit.title}
                            </span>
                            {isFrozenToday && (
                              <span style={{ fontSize: "0.6rem", color: th.dustyBlue, fontWeight: 500 }}>отдых</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5" style={{ color: th.gold }} />
                            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: th.gold }}>{habit.streak}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" style={{ color: th.textFaint }} /> : <ChevronDown className="w-3.5 h-3.5 ml-1" style={{ color: th.textFaint }} />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 rounded-full h-2" style={{ backgroundColor: th.border }}>
                            <motion.div className="h-2 rounded-full" style={{ backgroundColor: habit.color, opacity: 0.65 }}
                              initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }} />
                          </div>
                          <span style={{ fontSize: "0.65rem", color: th.textMuted }}>{habit.streak}/{habit.target}</span>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div className="px-4 pb-4" style={{ borderTop: `1px solid ${th.border}` }}
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <div className="pt-3">
                            <div className="flex items-center justify-between mb-3">
                              <span style={{ fontSize: "0.78rem", color: th.textMuted }}>
                                Лучший стрик: <span style={{ fontWeight: 600, color: th.text }}>{habit.bestStreak}</span>
                              </span>
                              <span style={{ fontSize: "0.7rem", color: th.textMuted }}>{categoryLabels[habit.category]}</span>
                            </div>

                            {/* Micro-habit */}
                            {!isDoneToday && !isFrozenToday && habit.microVersion && (
                              <motion.button
                                className="w-full py-2 rounded-xl mb-3 text-center flex items-center justify-center gap-1.5 border"
                                style={{
                                  fontSize: "0.75rem", fontWeight: 500,
                                  backgroundColor: th.lavender + "08",
                                  borderColor: th.lavender + "25",
                                  color: th.lavender,
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleHabitMicroToday(habit.id)}
                              >
                                <Zap className="w-3.5 h-3.5" />
                                Микро-версия: {habit.microVersion}
                              </motion.button>
                            )}

                            {/* Focus habit */}
                            <div className="flex gap-2 mb-3">
                              <button
                                className="flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5"
                                style={{
                                  fontSize: "0.75rem", fontWeight: 500,
                                  borderColor: focusHabit.habitId === habit.id ? th.gold + "40" : th.border,
                                  backgroundColor: focusHabit.habitId === habit.id ? th.gold + "10" : "transparent",
                                  color: focusHabit.habitId === habit.id ? th.gold : th.textMuted,
                                }}
                                onClick={() => setFocusHabitId(focusHabit.habitId === habit.id ? null : habit.id)}
                              >
                                <Focus className="w-3.5 h-3.5" />
                                {focusHabit.habitId === habit.id ? "Фокус ✓" : "Фокус недели"}
                              </button>
                              <button
                                className="w-full py-2 rounded-xl text-center flex-1"
                                style={{ fontSize: "0.75rem", fontWeight: 500, backgroundColor: th.bgSecondary, color: th.textMuted }}
                                onClick={() => setShowHeatmap(showHeatmap === habit.id ? null : habit.id)}
                              >
                                {showHeatmap === habit.id ? "Скрыть календарь" : "Календарь"}
                              </button>
                            </div>

                            {/* Habit stacking */}
                            <div className="mb-3">
                              <p style={{ fontSize: "0.68rem", fontWeight: 500, color: th.textMuted, marginBottom: 4 }}>
                                Связка: делать после...
                              </p>
                              <select
                                className="w-full rounded-lg px-3 py-2 border outline-none"
                                style={{ fontSize: "0.75rem", backgroundColor: th.bgSecondary, borderColor: th.border, color: th.text }}
                                value={habit.stackedAfter || ""}
                                onChange={(e) => setHabitStack(habit.id, e.target.value || null)}
                              >
                                <option value="">Без связки</option>
                                {habits.filter((h) => h.id !== habit.id).map((h) => (
                                  <option key={h.id} value={h.id}>{h.icon} {h.title}</option>
                                ))}
                              </select>
                              {habit.stackedAfter && (() => {
                                const parent = habits.find((h) => h.id === habit.stackedAfter);
                                if (!parent) return null;
                                return (
                                  <p style={{ fontSize: "0.62rem", color: th.sage, marginTop: 3, fontStyle: "italic" }}>
                                    После «{parent.title}» → «{habit.title}»
                                  </p>
                                );
                              })()}
                            </div>

                            {/* Heatmap */}
                            {showHeatmap === habit.id && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3">
                                <div className="grid grid-cols-10 gap-1">
                                  {heatmapData.map((dd, idx) => (
                                    <div
                                      key={idx}
                                      className="aspect-square rounded-sm flex items-center justify-center"
                                      style={{
                                        backgroundColor: dd.done ? habit.color + "60" : th.bgSecondary,
                                        border: dd.date === d ? `2px solid ${habit.color}` : "none",
                                      }}
                                      title={dd.date}
                                    >
                                      <span style={{ fontSize: "0.45rem", color: dd.done ? th.text : th.textFaint }}>{dd.day}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            <div className="flex gap-2">
                              {/* Freeze / rest day button */}
                              <button
                                className="py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5"
                                style={{
                                  fontSize: "0.78rem",
                                  fontWeight: 500,
                                  borderColor: isFrozenToday ? th.dustyBlue + "40" : th.border,
                                  backgroundColor: isFrozenToday ? th.dustyBlue + "12" : "transparent",
                                  color: th.dustyBlue,
                                }}
                                onClick={() => freezeHabitToday(habit.id)}
                              >
                                <Snowflake className="w-3.5 h-3.5" />
                                {isFrozenToday ? "Отменить отдых" : "День отдыха"}
                              </button>

                              {confirmDelete === habit.id ? (
                                <>
                                  <button className="flex-1 py-2 rounded-xl text-white"
                                    style={{ fontSize: "0.78rem", fontWeight: 600, backgroundColor: th.terracotta }}
                                    onClick={() => { deleteHabit(habit.id); setConfirmDelete(null); }}>Удалить</button>
                                  <button className="flex-1 py-2 rounded-xl border"
                                    style={{ fontSize: "0.78rem", fontWeight: 600, borderColor: th.border, color: th.textMuted }}
                                    onClick={() => setConfirmDelete(null)}>Отмена</button>
                                </>
                              ) : (
                                <button className="flex-1 py-2 rounded-xl border flex items-center justify-center gap-1.5"
                                  style={{ fontSize: "0.78rem", fontWeight: 500, borderColor: th.border, color: th.terracotta }}
                                  onClick={() => setConfirmDelete(habit.id)}>
                                  <Trash2 className="w-3.5 h-3.5" /> Удалить привычку
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
            {habits.length === 0 && (
              <div className="text-center py-12">
                <AppIcon icon="🌱" size={36} color={th.sage} />
                <p style={{ fontSize: "0.9rem", color: th.textMuted, marginTop: 8 }}>Добавьте первую привычку</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}