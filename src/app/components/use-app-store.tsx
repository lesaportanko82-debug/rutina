import { useState, useEffect, useCallback } from "react";
import { syncToServer, initialSync } from "./supabase-sync";

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  subtasks: { id: string; title: string; completed: boolean }[];
  category: "work" | "personal" | "health" | "study";
  priority: "low" | "medium" | "high";
  recurring?: "daily" | "weekly" | "monthly";
  dueDate?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  icon: string;
  color: string;
  streak: number;
  bestStreak: number;
  completedDates: string[];
  frozenDates: string[];
  target: number;
  category: "health" | "productivity" | "mindfulness" | "fitness";
  microVersion?: string; // minimal version for micro-habit
  stackedAfter?: string; // habitId — do this habit after another
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  color: string;
  note?: string;
  energy: number;
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  achievements: Achievement[];
  streak: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLong: number;
  autoStart: boolean;
  soundEnabled: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  days: number[];
  enabled: boolean;
  type: "habit" | "task" | "mood" | "water" | "custom";
  icon: string;
}

export interface Questionnaire {
  filled: boolean;
  name: string;
  age: string;
  goals: string[];
  stressLevel: number;
  sleepHours: string;
  productivityBlockers: string[];
  desiredHabits: string[];
  peakTime: string;
  exerciseFrequency: string;
  relaxMethods: string[];
  healthNotes: string;
  monthGoals: string;
  motivation: string;
  supportStyle: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  mood?: string;
  createdAt: string;
}

export interface DailyIntention {
  date: string;
  text: string;
}

export interface EveningCheckin {
  date: string;
  good: string;
  hard: string;
  word: string;
}

export interface AnxietyEntry {
  id: string;
  date: string;
  time: string;
  level: number; // 1-10
  trigger: string;
  notes?: string;
  usedBreathing: boolean;
  usedGrounding: boolean;
}

export interface PlantState {
  growthPoints: number;
  lastVisitDate: string;
  lastWateredDate: string;
  health: number;          // 0-100
  waterLevel: number;      // 0-100
  happiness: number;       // 0-100
  totalInteractions: number;
  createdAt: string;
  name: string;
  butterflies: number;
  dailyPointsLog: Record<string, number>; // date -> points earned that day (cap daily)
}

export interface WorryEntry {
  id: string;
  date: string;
  worry: string;
  probability: number; // 1-10
  category: string;
  reviewDate?: string;   // when to come back
  reviewed: boolean;
  happened?: boolean;    // did it happen?
  reviewNote?: string;
}

export interface BingoCard {
  id: string;
  weekStart: string;
  cells: BingoCell[];
  completedLines: number;
}

export interface BingoCell {
  text: string;
  icon: string;
  completed: boolean;
  completedAt?: string;
}

export interface CognitiveDistortionTag {
  id: string;
  date: string;
  distortion: string;
  journalEntryId?: string;
  context?: string;
}

export interface SOSContact {
  name: string;
  phone: string;
}

export interface SOSSettings {
  contacts: SOSContact[];
  favoriteTools: string[];
}

export interface ChallengeDay {
  day: number;
  task: string;
  icon: string;
  completed: boolean;
  completedAt?: string;
}

export interface Challenge {
  id: string;
  name: string;
  startDate: string;
  days: ChallengeDay[];
  active: boolean;
}

export interface LifeWheelEntry {
  id: string;
  date: string;
  scores: Record<string, number>; // area -> 1-10
}

export interface TimeCapsule {
  id: string;
  createdAt: string;
  openDate: string;       // when to reveal
  message: string;
  opened: boolean;
  openedAt?: string;
}

export interface SoftAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "care" | "growth" | "courage" | "connection" | "awareness";
  unlocked: boolean;
  unlockedAt?: string;
}

export interface FocusHabitState {
  habitId: string | null;
  weekStart: string;
}

export interface SleepEntry {
  id: string;
  date: string;
  quality: number;    // 1-5
  hours: number;      // hours slept
  bedtime: string;    // "23:00"
  wakeTime: string;   // "07:00"
  factors: string[];  // what affected sleep
  note?: string;
}

const today = () => new Date().toISOString().split("T")[0];

const defaultTasks: Task[] = [
  {
    id: "t1",
    title: "Подготовить презентацию",
    description: "Финальная версия для клиента",
    completed: false,
    subtasks: [
      { id: "s1", title: "Собрать данные", completed: true },
      { id: "s2", title: "Сделать слайды", completed: false },
      { id: "s3", title: "Прорепетировать", completed: false },
    ],
    category: "work",
    priority: "high",
    dueDate: today(),
    createdAt: today(),
  },
  {
    id: "t2",
    title: "Купить продукты",
    completed: false,
    subtasks: [
      { id: "s4", title: "Молоко", completed: false },
      { id: "s5", title: "Хлеб", completed: true },
      { id: "s6", title: "Овощи", completed: false },
    ],
    category: "personal",
    priority: "medium",
    createdAt: today(),
  },
  {
    id: "t3",
    title: "Утренняя пробежка",
    completed: true,
    subtasks: [],
    category: "health",
    priority: "medium",
    recurring: "daily",
    createdAt: today(),
  },
  {
    id: "t4",
    title: "Прочитать главу книги",
    completed: false,
    subtasks: [],
    category: "study",
    priority: "low",
    recurring: "daily",
    createdAt: today(),
  },
  {
    id: "t5",
    title: "Позвонить маме",
    completed: false,
    subtasks: [],
    category: "personal",
    priority: "medium",
    recurring: "weekly",
    createdAt: today(),
  },
];

const defaultHabits: Habit[] = [
  { id: "h1", title: "Медитация", icon: "🧘", color: "#9B8EC4", streak: 12, bestStreak: 21, completedDates: [], frozenDates: [], target: 7, category: "mindfulness" },
  { id: "h2", title: "Чтение", icon: "📚", color: "#7EA8BE", streak: 5, bestStreak: 14, completedDates: [], frozenDates: [], target: 5, category: "productivity" },
  { id: "h3", title: "Тренировка", icon: "💪", color: "#C4876C", streak: 3, bestStreak: 30, completedDates: [], frozenDates: [], target: 4, category: "fitness" },
  { id: "h4", title: "Пить воду", icon: "💧", color: "#7BAFB0", streak: 8, bestStreak: 45, completedDates: [], frozenDates: [], target: 7, category: "health" },
  { id: "h5", title: "Без телефона перед сном", icon: "📵", color: "#C4A86C", streak: 2, bestStreak: 7, completedDates: [], frozenDates: [], target: 7, category: "mindfulness" },
  { id: "h6", title: "Журнал благодарности", icon: "📝", color: "#8DB596", streak: 15, bestStreak: 15, completedDates: [], frozenDates: [], target: 7, category: "mindfulness" },
];

const defaultMoods: MoodEntry[] = [
  { id: "m1", date: "2026-03-01", mood: "Радость", color: "#D4B896", energy: 4 },
  { id: "m2", date: "2026-03-02", mood: "Спокойствие", color: "#8FAEBB", energy: 3 },
  { id: "m3", date: "2026-03-03", mood: "Энергия", color: "#C4956A", energy: 5 },
  { id: "m4", date: "2026-03-04", mood: "Тревога", color: "#9B8EC4", energy: 2 },
  { id: "m5", date: "2026-03-05", mood: "Радость", color: "#D4B896", energy: 4 },
  { id: "m6", date: "2026-03-06", mood: "Усталость", color: "#A3ADB8", energy: 1 },
];

const defaultProfile: UserProfile = {
  name: "Пользователь",
  level: 0,
  xp: 0,
  xpToNext: 100,
  coins: 0,
  streak: 0,
  achievements: [
    { id: "a1", title: "Первый шаг", description: "Завершите первую задачу", icon: "🌱", unlocked: false },
    { id: "a2", title: "Неделя заботы", description: "7 дней подряд", icon: "🌿", unlocked: false },
    { id: "a3", title: "Хранитель привычек", description: "Создайте 5 привычек", icon: "🌸", unlocked: false },
    { id: "a4", title: "Путь мастера", description: "Завершите 100 задач", icon: "🦋", unlocked: false },
    { id: "a5", title: "Месяц гармонии", description: "30 дней подряд", icon: "🌻", unlocked: false },
    { id: "a6", title: "Внутренний мир", description: "30 дней медитации", icon: "🧘", unlocked: false },
    { id: "a7", title: "Мир историй", description: "Читайте 30 дней подряд", icon: "📖", unlocked: false },
    { id: "a8", title: "Сила духа", description: "Тренируйтесь 60 дней", icon: "🏔️", unlocked: false },
  ],
};

const defaultPomodoroSettings: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
  autoStart: false,
  soundEnabled: true,
};

const defaultReminders: Reminder[] = [
  { id: "r1", title: "Утренняя медитация", time: "07:00", days: [1, 2, 3, 4, 5, 6, 0], enabled: true, type: "habit", icon: "🧘" },
  { id: "r2", title: "Выпить воду", time: "09:00", days: [1, 2, 3, 4, 5, 6, 0], enabled: true, type: "water", icon: "💧" },
  { id: "r3", title: "Проверить задачи", time: "10:00", days: [1, 2, 3, 4, 5], enabled: true, type: "task", icon: "📋" },
  { id: "r4", title: "Обеденный перерыв", time: "13:00", days: [1, 2, 3, 4, 5], enabled: false, type: "custom", icon: "🍽️" },
  { id: "r5", title: "Отметить настроение", time: "21:00", days: [1, 2, 3, 4, 5, 6, 0], enabled: true, type: "mood", icon: "😊" },
  { id: "r6", title: "Вечернее чтение", time: "22:00", days: [1, 2, 3, 4, 5, 6, 0], enabled: true, type: "habit", icon: "📚" },
];

const defaultQuestionnaire: Questionnaire = {
  filled: false, name: "", age: "", goals: [], stressLevel: 3, sleepHours: "",
  productivityBlockers: [], desiredHabits: [], peakTime: "", exerciseFrequency: "",
  relaxMethods: [], healthNotes: "", monthGoals: "", motivation: "", supportStyle: "",
};

const defaultSoftAchievements: SoftAchievement[] = [
  { id: "sa1", title: "Первый вдох", description: "Использовали дыхание при тревоге", icon: "🌬️", category: "courage", unlocked: false },
  { id: "sa2", title: "Неделя настроений", description: "7 дней подряд записывали настроение", icon: "🌈", category: "awareness", unlocked: false },
  { id: "sa3", title: "Письмо себе", description: "Написали первую капсулу времени", icon: "💌", category: "care", unlocked: false },
  { id: "sa4", title: "Самонаблюдатель", description: "Заметили когнитивное искажение", icon: "🔍", category: "awareness", unlocked: false },
  { id: "sa5", title: "Бинго-заботы", description: "Собрали первую линию в Self-Care Бинго", icon: "🎯", category: "care", unlocked: false },
  { id: "sa6", title: "Дыхание покоя", description: "Сделали 5 сеансов дыхательных упражнений", icon: "🧘", category: "growth", unlocked: false },
  { id: "sa7", title: "Тревоги не сбылись", description: "Проверили 5 тревог — они не сбылись", icon: "🎈", category: "courage", unlocked: false },
  { id: "sa8", title: "Заземление", description: "Прошли упражнение 5-4-3-2-1", icon: "🖐️", category: "courage", unlocked: false },
  { id: "sa9", title: "Журнал души", description: "Написали 10 записей в дневник", icon: "📝", category: "growth", unlocked: false },
  { id: "sa10", title: "Мягкий челлендж", description: "Начали 30-дневный челлендж мягкости", icon: "🌸", category: "care", unlocked: false },
  { id: "sa11", title: "Гармония сфер", description: "Заполнили колесо жизни", icon: "🎡", category: "awareness", unlocked: false },
  { id: "sa12", title: "Садовник", description: "Вырастили растение до 3 стадии", icon: "🌱", category: "connection", unlocked: false },
  { id: "sa13", title: "Месяц заботы", description: "30 дней с приложением", icon: "🌻", category: "growth", unlocked: false },
  { id: "sa14", title: "Друг себе", description: "Использовали SOS-карточку", icon: "🫂", category: "care", unlocked: false },
  { id: "sa15", title: "Мелодия покоя", description: "Слушали звуки природы 10 раз", icon: "🎧", category: "connection", unlocked: false },
];

function loadState<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    // Merge with defaults for objects to handle new fields
    if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
      return { ...fallback, ...parsed };
    }
    return parsed;
  } catch {
    return fallback;
  }
}

// One-time migration: reset profile to zero and re-show onboarding
const MIGRATION_KEY = "routine_migration_v4";
function runMigrations() {
  if (!localStorage.getItem(MIGRATION_KEY)) {
    localStorage.removeItem("routine_profile");
    localStorage.removeItem("routine_onboarding");
    localStorage.removeItem("routine_seen_tours");
    localStorage.removeItem("routine_seen_tips");
    localStorage.setItem(MIGRATION_KEY, "done");
  }
}
runMigrations();

export function useAppStore() {
  const [tasks, setTasks] = useState<Task[]>(() => loadState("routine_tasks", defaultTasks));
  const [habits, setHabits] = useState<Habit[]>(() => loadState("routine_habits", defaultHabits));
  const [moods, setMoods] = useState<MoodEntry[]>(() => loadState("routine_moods", defaultMoods));
  const [profile, setProfile] = useState<UserProfile>(() => loadState("routine_profile", defaultProfile));
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(() => loadState("routine_pomodoro", defaultPomodoroSettings));
  const [reminders, setReminders] = useState<Reminder[]>(() => loadState("routine_reminders", defaultReminders));
  const [pomodoroStats, setPomodoroStats] = useState<{ totalSessions: number; totalMinutes: number }>(() => loadState("routine_pomodoro_stats", { totalSessions: 0, totalMinutes: 0 }));
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>(() => loadState("routine_questionnaire", defaultQuestionnaire));
  const [darkMode, setDarkMode] = useState<boolean>(() => loadState("routine_dark_mode", false));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => loadState("routine_journal", []));
  const [onboardingDone, setOnboardingDoneState] = useState<boolean>(() => loadState("routine_onboarding", false));
  const [celebrationEvent, setCelebrationEvent] = useState<string | null>(null);
  const [seenTours, setSeenTours] = useState<string[]>(() => loadState("routine_seen_tours", []));
  const [seenTips, setSeenTips] = useState<string[]>(() => loadState("routine_seen_tips", []));
  const [dailyIntentions, setDailyIntentions] = useState<DailyIntention[]>(() => loadState("routine_intentions", []));
  const [eveningCheckins, setEveningCheckins] = useState<EveningCheckin[]>(() => loadState("routine_evening_checkins", []));
  const [anxietyEntries, setAnxietyEntries] = useState<AnxietyEntry[]>(() => loadState("routine_anxiety", []));
  const [plantState, setPlantState] = useState<PlantState>(() => loadState("routine_plant", {
    growthPoints: 0,
    lastVisitDate: today(),
    lastWateredDate: "",
    health: 80,
    waterLevel: 70,
    happiness: 60,
    totalInteractions: 0,
    createdAt: today(),
    name: "Росточек",
    butterflies: 0,
    dailyPointsLog: {},
  }));
  const [worryEntries, setWorryEntries] = useState<WorryEntry[]>(() => loadState("routine_worries", []));
  const [bingoCards, setBingoCards] = useState<BingoCard[]>(() => loadState("routine_bingo", []));
  const [cogDistortionTags, setCogDistortionTags] = useState<CognitiveDistortionTag[]>(() => loadState("routine_cog_distortions", []));
  const [sosSettings, setSosSettings] = useState<SOSSettings>(() => loadState("routine_sos", { contacts: [], favoriteTools: ["breathing", "grounding", "affirmation"] }));
  const [challenges, setChallenges] = useState<Challenge[]>(() => loadState("routine_challenges", []));
  const [lifeWheelEntries, setLifeWheelEntries] = useState<LifeWheelEntry[]>(() => loadState("routine_lifewheel", []));
  const [capsules, setCapsules] = useState<TimeCapsule[]>(() => loadState("routine_capsules", []));
  const [softAchievements, setSoftAchievements] = useState<SoftAchievement[]>(() => loadState("routine_soft_achievements", defaultSoftAchievements));
  const [focusHabit, setFocusHabit] = useState<FocusHabitState>(() => loadState("routine_focus_habit", { habitId: null, weekStart: "" }));
  const [favoriteTools, setFavoriteTools] = useState<string[]>(() => loadState("routine_favorite_tools", []));
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");

  // ─── localStorage + Supabase sync ───
  useEffect(() => { localStorage.setItem("routine_tasks", JSON.stringify(tasks)); syncToServer("routine_tasks", tasks); }, [tasks]);
  useEffect(() => { localStorage.setItem("routine_habits", JSON.stringify(habits)); syncToServer("routine_habits", habits); }, [habits]);
  useEffect(() => { localStorage.setItem("routine_moods", JSON.stringify(moods)); syncToServer("routine_moods", moods); }, [moods]);
  useEffect(() => { localStorage.setItem("routine_profile", JSON.stringify(profile)); syncToServer("routine_profile", profile); }, [profile]);
  useEffect(() => { localStorage.setItem("routine_pomodoro", JSON.stringify(pomodoroSettings)); syncToServer("routine_pomodoro", pomodoroSettings); }, [pomodoroSettings]);
  useEffect(() => { localStorage.setItem("routine_reminders", JSON.stringify(reminders)); syncToServer("routine_reminders", reminders); }, [reminders]);
  useEffect(() => { localStorage.setItem("routine_pomodoro_stats", JSON.stringify(pomodoroStats)); syncToServer("routine_pomodoro_stats", pomodoroStats); }, [pomodoroStats]);
  useEffect(() => { localStorage.setItem("routine_questionnaire", JSON.stringify(questionnaire)); syncToServer("routine_questionnaire", questionnaire); }, [questionnaire]);
  useEffect(() => { localStorage.setItem("routine_dark_mode", JSON.stringify(darkMode)); syncToServer("routine_dark_mode", darkMode); }, [darkMode]);
  useEffect(() => { localStorage.setItem("routine_journal", JSON.stringify(journalEntries)); syncToServer("routine_journal", journalEntries); }, [journalEntries]);
  useEffect(() => { localStorage.setItem("routine_onboarding", JSON.stringify(onboardingDone)); syncToServer("routine_onboarding", onboardingDone); }, [onboardingDone]);
  useEffect(() => { localStorage.setItem("routine_seen_tours", JSON.stringify(seenTours)); syncToServer("routine_seen_tours", seenTours); }, [seenTours]);
  useEffect(() => { localStorage.setItem("routine_seen_tips", JSON.stringify(seenTips)); syncToServer("routine_seen_tips", seenTips); }, [seenTips]);
  useEffect(() => { localStorage.setItem("routine_intentions", JSON.stringify(dailyIntentions)); syncToServer("routine_intentions", dailyIntentions); }, [dailyIntentions]);
  useEffect(() => { localStorage.setItem("routine_evening_checkins", JSON.stringify(eveningCheckins)); syncToServer("routine_evening_checkins", eveningCheckins); }, [eveningCheckins]);
  useEffect(() => { localStorage.setItem("routine_anxiety", JSON.stringify(anxietyEntries)); syncToServer("routine_anxiety", anxietyEntries); }, [anxietyEntries]);
  useEffect(() => { localStorage.setItem("routine_plant", JSON.stringify(plantState)); syncToServer("routine_plant", plantState); }, [plantState]);
  useEffect(() => { localStorage.setItem("routine_worries", JSON.stringify(worryEntries)); syncToServer("routine_worries", worryEntries); }, [worryEntries]);
  useEffect(() => { localStorage.setItem("routine_bingo", JSON.stringify(bingoCards)); syncToServer("routine_bingo", bingoCards); }, [bingoCards]);
  useEffect(() => { localStorage.setItem("routine_cog_distortions", JSON.stringify(cogDistortionTags)); syncToServer("routine_cog_distortions", cogDistortionTags); }, [cogDistortionTags]);
  useEffect(() => { localStorage.setItem("routine_sos", JSON.stringify(sosSettings)); syncToServer("routine_sos", sosSettings); }, [sosSettings]);
  useEffect(() => { localStorage.setItem("routine_challenges", JSON.stringify(challenges)); syncToServer("routine_challenges", challenges); }, [challenges]);
  useEffect(() => { localStorage.setItem("routine_lifewheel", JSON.stringify(lifeWheelEntries)); syncToServer("routine_lifewheel", lifeWheelEntries); }, [lifeWheelEntries]);
  useEffect(() => { localStorage.setItem("routine_capsules", JSON.stringify(capsules)); syncToServer("routine_capsules", capsules); }, [capsules]);
  useEffect(() => { localStorage.setItem("routine_soft_achievements", JSON.stringify(softAchievements)); syncToServer("routine_soft_achievements", softAchievements); }, [softAchievements]);
  useEffect(() => { localStorage.setItem("routine_focus_habit", JSON.stringify(focusHabit)); syncToServer("routine_focus_habit", focusHabit); }, [focusHabit]);
  useEffect(() => { localStorage.setItem("routine_favorite_tools", JSON.stringify(favoriteTools)); syncToServer("routine_favorite_tools", favoriteTools); }, [favoriteTools]);

  // ─── Initial Supabase sync ───
  useEffect(() => {
    setSyncStatus("syncing");
    initialSync()
      .then((merged) => {
        setSyncStatus("synced");
        if (merged) {
          // Reload from localStorage if server data was merged
          window.location.reload();
        }
      })
      .catch(() => setSyncStatus("error"));
  }, []);

  // ─── Sleep Check-in (state declared here, addSleepEntry defined after addXP) ───
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>(() => loadState("routine_sleep", []));
  useEffect(() => { localStorage.setItem("routine_sleep", JSON.stringify(sleepEntries)); syncToServer("routine_sleep", sleepEntries); }, [sleepEntries]);

  // ─── Habit Stacking ───
  const setHabitStack = useCallback((habitId: string, stackAfter: string | null) => {
    setHabits((prev) =>
      prev.map((h) => h.id === habitId ? { ...h, stackedAfter: stackAfter || undefined } : h)
    );
  }, []);

  // ─── Plant visit logic: decay health based on days absent ───
  useEffect(() => {
    const d = today();
    if (plantState.lastVisitDate === d) return;
    const lastDate = new Date(plantState.lastVisitDate + "T12:00:00");
    const nowDate = new Date(d + "T12:00:00");
    const daysAway = Math.max(0, Math.round((nowDate.getTime() - lastDate.getTime()) / 86400000));
    const healthLoss = Math.min(daysAway * 12, 80); // 12 per day, max loss 80
    const waterLoss = Math.min(daysAway * 18, 100);
    const happinessLoss = Math.min(daysAway * 10, 70);
    // Recover a bit for coming back
    const comebackBonus = daysAway > 0 ? Math.min(daysAway * 3, 15) : 0;
    setPlantState((p) => ({
      ...p,
      lastVisitDate: d,
      health: Math.max(0, Math.min(100, p.health - healthLoss + comebackBonus)),
      waterLevel: Math.max(0, p.waterLevel - waterLoss),
      happiness: Math.max(0, Math.min(100, p.happiness - happinessLoss + comebackBonus)),
    }));
  }, []); // runs once on mount

  const triggerCelebration = useCallback((event: string) => {
    setCelebrationEvent(event);
    setTimeout(() => setCelebrationEvent(null), 3000);
  }, []);

  const addXP = useCallback((amount: number) => {
    setProfile((p) => {
      let newXP = p.xp + amount;
      let newLevel = p.level;
      let newXPToNext = p.xpToNext;
      let leveled = false;
      while (newXP >= newXPToNext) {
        newXP -= newXPToNext;
        newLevel++;
        newXPToNext = Math.round(newXPToNext * 1.3);
        leveled = true;
      }
      if (leveled) {
        setTimeout(() => triggerCelebration("level-up"), 100);
      }
      return { ...p, xp: newXP, level: newLevel, xpToNext: newXPToNext, coins: p.coins + Math.round(amount / 2) };
    });
  }, [triggerCelebration]);

  // ─── Tasks ───
  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newCompleted = !t.completed;
          if (newCompleted) {
            addXP(20);
            // Feed plant on task completion
            const d = today();
            setPlantState((p) => {
              const todayPts = p.dailyPointsLog[d] || 0;
              const allowed = Math.min(3, 35 - todayPts);
              if (allowed <= 0) return p;
              return { ...p, growthPoints: p.growthPoints + allowed, health: Math.min(100, p.health + 1), dailyPointsLog: { ...p.dailyPointsLog, [d]: todayPts + allowed } };
            });
          }
          return { ...t, completed: newCompleted };
        }
        return t;
      })
    );
  }, [addXP]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newSubs = t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          );
          if (newSubs.find(s => s.id === subtaskId)?.completed) addXP(5);
          return { ...t, subtasks: newSubs };
        }
        return t;
      })
    );
  }, [addXP]);

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt" | "completed" | "subtasks">) => {
    setTasks((prev) => [
      ...prev,
      { ...task, id: "t" + Date.now(), createdAt: today(), completed: false, subtasks: [] },
    ]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Pick<Task, "title" | "category" | "priority" | "recurring" | "description" | "dueDate">>) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) => t.id === taskId
        ? { ...t, subtasks: [...t.subtasks, { id: "s" + Date.now(), title, completed: false }] }
        : t
      )
    );
  }, []);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => t.id === taskId
        ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
        : t
      )
    );
  }, []);

  // ─── Habits ───
  const toggleHabitToday = useCallback((id: string) => {
    const d = today();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const alreadyDone = h.completedDates.includes(d);
          if (alreadyDone) {
            return {
              ...h,
              completedDates: h.completedDates.filter((dd) => dd !== d),
              streak: Math.max(0, h.streak - 1),
            };
          }
          const newStreak = h.streak + 1;
          addXP(15);
          // Feed plant on habit completion
          setPlantState((p) => {
            const todayPts = p.dailyPointsLog[d] || 0;
            const allowed = Math.min(4, 35 - todayPts);
            if (allowed <= 0) return p;
            return { ...p, growthPoints: p.growthPoints + allowed, health: Math.min(100, p.health + 1), happiness: Math.min(100, p.happiness + 1), dailyPointsLog: { ...p.dailyPointsLog, [d]: todayPts + allowed } };
          });
          if (newStreak === 7 || newStreak === 30 || newStreak === 100) {
            triggerCelebration(`streak-${newStreak}`);
          }
          return {
            ...h,
            completedDates: [...h.completedDates, d],
            streak: newStreak,
            bestStreak: Math.max(h.bestStreak, newStreak),
          };
        }
        return h;
      })
    );
  }, [addXP, triggerCelebration]);

  const addHabit = useCallback((habit: Omit<Habit, "id" | "streak" | "bestStreak" | "completedDates" | "frozenDates">) => {
    setHabits((prev) => [
      ...prev,
      { ...habit, id: "h" + Date.now(), streak: 0, bestStreak: 0, completedDates: [], frozenDates: [] },
    ]);
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const reorderHabits = useCallback((fromIndex: number, toIndex: number) => {
    setHabits((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
  }, []);

  const freezeHabitToday = useCallback((id: string) => {
    const d = today();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const alreadyFrozen = (h.frozenDates || []).includes(d);
        if (alreadyFrozen) {
          return { ...h, frozenDates: h.frozenDates.filter((dd) => dd !== d) };
        }
        // Remove from completed if it was completed today, then freeze
        const wasCompleted = h.completedDates.includes(d);
        return {
          ...h,
          frozenDates: [...(h.frozenDates || []), d],
          completedDates: wasCompleted ? h.completedDates.filter((dd) => dd !== d) : h.completedDates,
          streak: wasCompleted ? Math.max(0, h.streak - 1) : h.streak,
        };
      })
    );
  }, []);

  // ─── Mood ───
  const addMoodEntry = useCallback((mood: string, color: string, energy: number, note?: string) => {
    const d = today();
    setMoods((prev) => {
      const existing = prev.findIndex((m) => m.date === d);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], mood, color, energy, note };
        return updated;
      }
      return [...prev, { id: "m" + Date.now(), date: d, mood, color, energy, note }];
    });
    addXP(10);
    // Feed plant on mood logging
    setPlantState((p) => {
      const todayPts = p.dailyPointsLog[d] || 0;
      const allowed = Math.min(3, 35 - todayPts);
      if (allowed <= 0) return p;
      return { ...p, growthPoints: p.growthPoints + allowed, happiness: Math.min(100, p.happiness + 2), dailyPointsLog: { ...p.dailyPointsLog, [d]: todayPts + allowed } };
    });
  }, [addXP]);

  const deleteMoodEntry = useCallback((id: string) => {
    setMoods((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ─── Pomodoro ───
  const updatePomodoroSettings = useCallback((settings: Partial<PomodoroSettings>) => {
    setPomodoroSettings((prev) => ({ ...prev, ...settings }));
  }, []);

  const completePomodoroSession = useCallback(() => {
    setPomodoroStats((prev) => ({
      totalSessions: prev.totalSessions + 1,
      totalMinutes: prev.totalMinutes + pomodoroSettings.workMinutes,
    }));
    addXP(25);
    if (pomodoroStats.totalSessions + 1 === 10) {
      triggerCelebration("pomodoro-10");
    }
  }, [pomodoroSettings.workMinutes, addXP, pomodoroStats.totalSessions, triggerCelebration]);

  // ─── Reminders ───
  const toggleReminder = useCallback((id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }, []);

  const addReminder = useCallback((reminder: Omit<Reminder, "id">) => {
    setReminders((prev) => [...prev, { ...reminder, id: "r" + Date.now() }]);
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateReminder = useCallback((id: string, updates: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  // ─── Questionnaire ───
  const saveQuestionnaire = useCallback((data: Partial<Questionnaire>) => {
    setQuestionnaire((prev) => ({ ...prev, ...data, filled: true }));
    if (data.name) {
      setProfile((p) => ({ ...p, name: data.name! }));
    }
  }, []);

  const resetQuestionnaire = useCallback(() => {
    setQuestionnaire(defaultQuestionnaire);
  }, []);

  // ─── Dark Mode ───
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  // ─── Journal ───
  const addJournalEntry = useCallback((text: string, mood?: string) => {
    setJournalEntries((prev) => [
      { id: "j" + Date.now(), date: today(), text, mood, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    addXP(10);
  }, [addXP]);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ─── Onboarding ───
  const setOnboardingDone = useCallback(() => {
    setOnboardingDoneState(true);
  }, []);

  // ─── Tours & Tips ───
  const markTourSeen = useCallback((tourKey: string) => {
    setSeenTours((prev) => prev.includes(tourKey) ? prev : [...prev, tourKey]);
  }, []);

  const dismissTip = useCallback((tipKey: string) => {
    setSeenTips((prev) => prev.includes(tipKey) ? prev : [...prev, tipKey]);
  }, []);

  const resetTours = useCallback(() => {
    setSeenTours([]);
    setSeenTips([]);
  }, []);

  // ─── Daily Intentions ───
  const setDailyIntention = useCallback((text: string) => {
    const d = today();
    setDailyIntentions((prev) => {
      const existing = prev.findIndex((i) => i.date === d);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { date: d, text };
        return updated;
      }
      return [...prev, { date: d, text }];
    });
    addXP(5);
  }, [addXP]);

  const getTodayIntention = useCallback(() => {
    return dailyIntentions.find((i) => i.date === today()) || null;
  }, [dailyIntentions]);

  // ─── Evening Checkins ───
  const saveEveningCheckin = useCallback((good: string, hard: string, word: string) => {
    const d = today();
    setEveningCheckins((prev) => {
      const existing = prev.findIndex((c) => c.date === d);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { date: d, good, hard, word };
        return updated;
      }
      return [...prev, { date: d, good, hard, word }];
    });
    addXP(10);
  }, [addXP]);

  const getTodayCheckin = useCallback(() => {
    return eveningCheckins.find((c) => c.date === today()) || null;
  }, [eveningCheckins]);

  // ─── Anxiety Tracker ───
  const addAnxietyEntry = useCallback((level: number, trigger: string, notes?: string, usedBreathing = false, usedGrounding = false) => {
    const d = today();
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    setAnxietyEntries((prev) => [
      { id: "ax" + Date.now(), date: d, time, level, trigger, notes, usedBreathing, usedGrounding },
      ...prev,
    ]);
    addXP(8);
  }, [addXP]);

  const deleteAnxietyEntry = useCallback((id: string) => {
    setAnxietyEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ─── Plant ───
  const waterPlant = useCallback(() => {
    const d = today();
    setPlantState((p) => ({
      ...p,
      lastWateredDate: d,
      waterLevel: Math.min(100, p.waterLevel + 30),
      health: Math.min(100, p.health + 8),
      happiness: Math.min(100, p.happiness + 5),
      totalInteractions: p.totalInteractions + 1,
    }));
  }, []);

  const interactPlant = useCallback(() => {
    setPlantState((p) => ({
      ...p,
      happiness: Math.min(100, p.happiness + 3),
      totalInteractions: p.totalInteractions + 1,
    }));
  }, []);

  const feedPlantGrowth = useCallback((points: number) => {
    const d = today();
    setPlantState((p) => {
      const todayPts = p.dailyPointsLog[d] || 0;
      const maxDaily = 35; // cap daily growth to slow it down
      const allowed = Math.min(points, maxDaily - todayPts);
      if (allowed <= 0) return p;
      return {
        ...p,
        growthPoints: p.growthPoints + allowed,
        health: Math.min(100, p.health + Math.round(allowed * 0.3)),
        happiness: Math.min(100, p.happiness + Math.round(allowed * 0.2)),
        dailyPointsLog: { ...p.dailyPointsLog, [d]: todayPts + allowed },
      };
    });
  }, []);

  const renamePlant = useCallback((name: string) => {
    setPlantState((p) => ({ ...p, name }));
  }, []);

  const addButterfly = useCallback(() => {
    setPlantState((p) => ({
      ...p,
      butterflies: p.butterflies + 1,
      happiness: Math.min(100, p.happiness + 2),
    }));
  }, []);

  // ─── Worry Journal ───
  const addWorryEntry = useCallback((worry: string, probability: number, category: string, reviewDays: number) => {
    const d = today();
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + reviewDays);
    setWorryEntries((prev) => [
      { id: "w" + Date.now(), date: d, worry, probability, category, reviewDate: reviewDate.toISOString().split("T")[0], reviewed: false },
      ...prev,
    ]);
    addXP(8);
  }, [addXP]);

  const reviewWorryEntry = useCallback((id: string, happened: boolean, reviewNote?: string) => {
    setWorryEntries((prev) =>
      prev.map((w) => w.id === id ? { ...w, reviewed: true, happened, reviewNote } : w)
    );
    addXP(10);
  }, [addXP]);

  const deleteWorryEntry = useCallback((id: string) => {
    setWorryEntries((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // ─── Bingo ───
  const saveBingoCards = useCallback((cards: BingoCard[]) => {
    setBingoCards(cards);
  }, []);

  // ─── Cognitive Distortions ───
  const addCogDistortionTag = useCallback((distortion: string, journalEntryId?: string, context?: string) => {
    setCogDistortionTags((prev) => [
      { id: "cd" + Date.now(), date: today(), distortion, journalEntryId, context },
      ...prev,
    ]);
    addXP(5);
  }, [addXP]);

  const deleteCogDistortionTag = useCallback((id: string) => {
    setCogDistortionTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── SOS ───
  const updateSOSSettings = useCallback((settings: Partial<SOSSettings>) => {
    setSosSettings((prev) => ({ ...prev, ...settings }));
  }, []);

  // ─── Challenges ───
  const saveChallenges = useCallback((ch: Challenge[]) => {
    setChallenges(ch);
  }, []);

  // ─── Life Wheel ───
  const addLifeWheelEntry = useCallback((scores: Record<string, number>) => {
    const d = today();
    setLifeWheelEntries((prev) => {
      const existing = prev.findIndex((e) => e.date === d);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], scores };
        return updated;
      }
      return [...prev, { id: "lw" + Date.now(), date: d, scores }];
    });
    addXP(15);
  }, [addXP]);

  // ─── Time Capsules ───
  const addCapsule = useCallback((message: string, openInDays: number) => {
    const openDate = new Date();
    openDate.setDate(openDate.getDate() + openInDays);
    setCapsules((prev) => [
      ...prev,
      { id: "cap" + Date.now(), createdAt: new Date().toISOString(), openDate: openDate.toISOString().split("T")[0], message, opened: false },
    ]);
    addXP(12);
  }, [addXP]);

  const openCapsule = useCallback((id: string) => {
    setCapsules((prev) =>
      prev.map((c) => c.id === id ? { ...c, opened: true, openedAt: new Date().toISOString() } : c)
    );
    addXP(20);
  }, [addXP]);

  const deleteCapsule = useCallback((id: string) => {
    setCapsules((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ─── Soft Achievements ───
  const unlockSoftAchievement = useCallback((id: string) => {
    setSoftAchievements((prev) =>
      prev.map((a) => a.id === id && !a.unlocked ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a)
    );
    addXP(15);
  }, [addXP]);

  // ─── Sleep Check-in function (defined after addXP) ───
  const addSleepEntry = useCallback((entry: Omit<SleepEntry, "id" | "date">) => {
    const d = today();
    setSleepEntries((prev) => {
      const existing = prev.findIndex((e) => e.date === d);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...entry };
        return updated;
      }
      return [{ ...entry, id: "sl" + Date.now(), date: d }, ...prev];
    });
    addXP(10);
  }, [addXP]);

  // ─── Achievement engine — auto-unlock soft achievements ───
  useEffect(() => {
    const checks: Array<{ id: string; condition: boolean }> = [
      { id: "sa1", condition: anxietyEntries.some((a) => a.usedBreathing) },
      { id: "sa2", condition: (() => {
        const dates = moods.map((m) => m.date).sort();
        if (dates.length < 7) return false;
        let consecutive = 1;
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1] + "T12:00:00");
          const curr = new Date(dates[i] + "T12:00:00");
          const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
          if (diff === 1) { consecutive++; if (consecutive >= 7) return true; }
          else if (diff > 1) consecutive = 1;
        }
        return false;
      })() },
      { id: "sa3", condition: capsules.length > 0 },
      { id: "sa4", condition: cogDistortionTags.length > 0 },
      { id: "sa5", condition: bingoCards.some((b) => b.completedLines > 0) },
      { id: "sa6", condition: anxietyEntries.filter((a) => a.usedBreathing).length >= 5 },
      { id: "sa7", condition: worryEntries.filter((w) => w.reviewed && !w.happened).length >= 5 },
      { id: "sa8", condition: anxietyEntries.some((a) => a.usedGrounding) },
      { id: "sa9", condition: journalEntries.length >= 10 },
      { id: "sa10", condition: challenges.length > 0 },
      { id: "sa11", condition: lifeWheelEntries.length > 0 },
      { id: "sa12", condition: plantState.growthPoints >= 60 },
      { id: "sa13", condition: (() => {
        const created = plantState.createdAt;
        if (!created) return false;
        const diff = Math.round((Date.now() - new Date(created + "T12:00:00").getTime()) / 86400000);
        return diff >= 30;
      })() },
      { id: "sa14", condition: (seenTips || []).includes("sos-used") },
      { id: "sa15", condition: (() => {
        const count = parseInt(localStorage.getItem("routine_soundscape_count") || "0");
        return count >= 10;
      })() },
    ];
    let changed = false;
    for (const { id, condition } of checks) {
      if (condition) {
        const ach = softAchievements.find((a) => a.id === id);
        if (ach && !ach.unlocked) {
          unlockSoftAchievement(id);
          changed = true;
        }
      }
    }
    if (changed) triggerCelebration("soft-achievement");
  }, [moods.length, anxietyEntries.length, capsules.length, cogDistortionTags.length, bingoCards, worryEntries, journalEntries.length, challenges.length, lifeWheelEntries.length, plantState.growthPoints, softAchievements, unlockSoftAchievement, triggerCelebration]);

  // ─── Focus Habit ───
  const setFocusHabitId = useCallback((habitId: string | null) => {
    const weekStart = (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff)).toISOString().split("T")[0];
    })();
    setFocusHabit({ habitId, weekStart });
  }, []);

  // ─── Micro-habits: toggle micro version ───
  const toggleHabitMicroToday = useCallback((id: string) => {
    const d = today();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const alreadyDone = h.completedDates.includes(d);
        if (alreadyDone) return h; // already completed full version
        // Mark as micro-completed (use same mechanism, but give less XP)
        addXP(5);
        return {
          ...h,
          completedDates: [...h.completedDates, d],
          streak: h.streak + 1,
          bestStreak: Math.max(h.bestStreak, h.streak + 1),
        };
      })
    );
  }, [addXP]);

  // ─── Export ───
  const exportData = useCallback(() => {
    const data = { tasks, habits, moods, profile, pomodoroSettings, reminders, pomodoroStats, questionnaire, journalEntries };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routine-data-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks, habits, moods, profile, pomodoroSettings, reminders, pomodoroStats, questionnaire, journalEntries]);

  return {
    tasks, habits, moods, profile, pomodoroSettings, reminders, pomodoroStats, questionnaire,
    darkMode, journalEntries, onboardingDone, celebrationEvent, seenTours, seenTips,
    dailyIntentions, eveningCheckins, anxietyEntries, plantState,
    worryEntries, bingoCards, cogDistortionTags, sosSettings,
    challenges, lifeWheelEntries, capsules, softAchievements, focusHabit, syncStatus,
    sleepEntries,
    favoriteTools, setFavoriteTools,
    toggleTask, toggleSubtask, addTask, updateTask, deleteTask, addSubtask, deleteSubtask,
    toggleHabitToday, addHabit, deleteHabit, reorderHabits, freezeHabitToday, toggleHabitMicroToday,
    setHabitStack,
    addMoodEntry, deleteMoodEntry,
    addXP,
    updatePomodoroSettings, completePomodoroSession,
    toggleReminder, addReminder, deleteReminder, updateReminder,
    saveQuestionnaire, resetQuestionnaire,
    toggleDarkMode,
    addJournalEntry, deleteJournalEntry,
    setOnboardingDone,
    exportData,
    triggerCelebration,
    markTourSeen, dismissTip, resetTours,
    setDailyIntention, getTodayIntention,
    saveEveningCheckin, getTodayCheckin,
    addAnxietyEntry, deleteAnxietyEntry,
    waterPlant, interactPlant, feedPlantGrowth, renamePlant, addButterfly,
    addWorryEntry, reviewWorryEntry, deleteWorryEntry,
    saveBingoCards,
    addCogDistortionTag, deleteCogDistortionTag,
    updateSOSSettings,
    saveChallenges, addLifeWheelEntry,
    addCapsule, openCapsule, deleteCapsule,
    unlockSoftAchievement,
    setFocusHabitId,
    addSleepEntry,
  };
}