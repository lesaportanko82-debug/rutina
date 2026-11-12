import type { Questionnaire, Task, Habit, MoodEntry, UserProfile } from "./use-app-store";

export interface Recommendation {
  id: string;
  icon: string;
  title: string;
  text: string;
  category: "wellbeing" | "productivity" | "habits" | "mindfulness" | "energy" | "personal";
  color: string;
  priority: number; // 1-10, higher = more important
}

interface AppData {
  questionnaire: Questionnaire;
  tasks: Task[];
  habits: Habit[];
  moods: MoodEntry[];
  profile: UserProfile;
  pomodoroStats: { totalSessions: number; totalMinutes: number };
}

const today = () => new Date().toISOString().split("T")[0];

function getSupportPrefix(style: string): string {
  switch (style) {
    case "gentle": return "";
    case "encouraging": return "";
    case "structured": return "";
    case "playful": return "";
    default: return "";
  }
}

function wrapInStyle(text: string, style: string): string {
  switch (style) {
    case "gentle": return text;
    case "encouraging": return text.replace(/\.$/, "!").replace(/([^!])$/, "$1!");
    case "structured": return text;
    case "playful": return text;
    default: return text;
  }
}

// ─── Daily personalized greeting tip ───

export function getDailyTip(data: AppData): string {
  const { questionnaire: q } = data;
  if (!q.filled) return "Заполните анкету, чтобы получать персональные советы";

  const hour = new Date().getHours();
  const tips: string[] = [];

  // Time-based + peakTime
  if (q.peakTime === "morning" && hour >= 6 && hour < 12) {
    tips.push("Сейчас ваше самое продуктивное время — используйте его для важных дел");
  } else if (q.peakTime === "afternoon" && hour >= 12 && hour < 18) {
    tips.push("Ваш пик продуктивности — сейчас! Самое время для сложных задач");
  } else if (q.peakTime === "evening" && hour >= 18) {
    tips.push("Вечер — ваше время силы. Погрузитесь в то, что важно");
  } else if (q.peakTime === "night" && (hour >= 22 || hour < 4)) {
    tips.push("Ночная тишина — ваш союзник. Творите и созидайте");
  }

  // Off-peak suggestions
  if (q.peakTime === "morning" && hour >= 18) {
    tips.push("Вечер — время для отдыха. Ваш мозг лучше всего работает утром");
  }
  if (q.peakTime === "evening" && hour >= 6 && hour < 12) {
    tips.push("Утро — время для спокойных дел. Ваша сила придёт вечером");
  }

  // Stress-based
  if (q.stressLevel >= 4) {
    tips.push("Помните: вы не обязаны быть продуктивным каждую минуту. Отдых — тоже работа над собой");
    tips.push("Сделайте глубокий вдох. Вы справляетесь лучше, чем думаете");
  }

  // Sleep-based
  if (q.sleepHours === "<5" || q.sleepHours === "5-6") {
    tips.push("Вы спите меньше нормы — попробуйте лечь на 15 минут раньше сегодня");
  }

  // Goal-based
  if (q.goals.includes("balance")) {
    tips.push("Баланс — это не 50/50, а ощущение гармонии. Прислушайтесь к себе сегодня");
  }
  if (q.goals.includes("mindfulness")) {
    tips.push("Остановитесь на минуту и просто подышите. Осознанность начинается с этого");
  }
  if (q.goals.includes("health")) {
    tips.push("Ваше тело — ваш главный ресурс. Позаботьтесь о нём сегодня");
  }

  // Exercise-based
  if (q.exerciseFrequency === "never" || q.exerciseFrequency === "rarely") {
    if (hour >= 10 && hour <= 17) {
      tips.push("Даже 10 минут ходьбы могут поднять настроение. Попробуйте прогуляться");
    }
  }

  // Blocker-based
  if (q.productivityBlockers.includes("Прокрастинация")) {
    tips.push("Правило двух минут: если дело занимает меньше 2 минут — сделайте его сейчас");
  }
  if (q.productivityBlockers.includes("Перфекционизм")) {
    tips.push("Сделано лучше, чем идеально. Разрешите себе быть «достаточно хорошим»");
  }

  // Relax suggestions
  if (q.relaxMethods.length > 0 && q.stressLevel >= 3 && hour >= 18) {
    const method = q.relaxMethods[Math.floor(Math.random() * q.relaxMethods.length)];
    tips.push(`Вечер — время отдыха. Может, сегодня: ${method.toLowerCase()}?`);
  }

  if (tips.length === 0) {
    tips.push("Вы на верном пути. Каждый день — это маленькая победа");
  }

  // Pick one based on day seed for consistency
  const daySeed = new Date().getDate() + new Date().getHours();
  return tips[daySeed % tips.length];
}

// ─── Full recommendation list ───

export function getPersonalizedRecommendations(data: AppData): Recommendation[] {
  const { questionnaire: q, tasks, habits, moods, profile, pomodoroStats } = data;
  const recs: Recommendation[] = [];
  const d = today();

  // ─── Data-driven recommendations (always) ───

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const habitsToday = habits.filter((h) => h.completedDates.includes(d)).length;
  const avgEnergy = moods.length > 0 ? moods.reduce((s, m) => s + m.energy, 0) / moods.length : 0;
  const recentMoods = moods.slice(-7);
  const lowEnergyDays = recentMoods.filter((m) => m.energy <= 2).length;
  const lowStreakHabits = habits.filter((h) => h.streak < 3 && h.streak > 0);
  const zeroStreakHabits = habits.filter((h) => h.streak === 0);

  // Completion rate
  if (completionRate >= 80 && totalTasks >= 3) {
    recs.push({
      id: "high-completion",
      icon: "🌟",
      title: "Прекрасный результат",
      text: "Вы выполнили больше 80% задач. Это показатель настоящей дисциплины — гордитесь собой.",
      category: "productivity",
      color: "#8DB596",
      priority: 3,
    });
  } else if (completionRate < 30 && totalTasks >= 3) {
    recs.push({
      id: "low-completion",
      icon: "🌱",
      title: "Начните с малого",
      text: "Много незавершённых задач? Выберите только одну самую важную и сделайте её. Остальное подождёт.",
      category: "productivity",
      color: "#C4A86C",
      priority: 7,
    });
  }

  // Habit streaks
  if (lowStreakHabits.length > 0) {
    const habit = lowStreakHabits[0];
    recs.push({
      id: "low-streak",
      icon: "🔥",
      title: `Поддержите «${habit.title}»`,
      text: `Стрик ${habit.streak} — ещё немного и вы почувствуете, как привычка становится частью вас.`,
      category: "habits",
      color: "#C4876C",
      priority: 6,
    });
  }

  if (zeroStreakHabits.length > 0 && zeroStreakHabits.length <= 2) {
    recs.push({
      id: "zero-streak",
      icon: "🌿",
      title: "Время вернуться",
      text: `Привычка «${zeroStreakHabits[0].title}» ждёт вас. Даже одна минута — это уже шаг вперёд.`,
      category: "habits",
      color: "#7BAFB0",
      priority: 5,
    });
  }

  // All habits done today
  if (habitsToday === habits.length && habits.length > 0) {
    recs.push({
      id: "all-habits-done",
      icon: "✨",
      title: "Все привычки выполнены!",
      text: "Вы выполнили все привычки сегодня. Это невероятная последовательность — вы настоящий мастер.",
      category: "habits",
      color: "#8DB596",
      priority: 2,
    });
  }

  // Energy trends
  if (lowEnergyDays >= 4 && recentMoods.length >= 5) {
    recs.push({
      id: "low-energy-trend",
      icon: "🌙",
      title: "Позаботьтесь о себе",
      text: "Несколько дней подряд ваша энергия была низкой. Прислушайтесь к телу — может, пора замедлиться?",
      category: "wellbeing",
      color: "#9B8EC4",
      priority: 9,
    });
  }

  if (avgEnergy >= 4 && moods.length >= 3) {
    recs.push({
      id: "high-energy",
      icon: "☀️",
      title: "Энергия на высоте",
      text: "Ваш средний уровень энергии отличный! Продолжайте делать то, что работает для вас.",
      category: "energy",
      color: "#C4A86C",
      priority: 2,
    });
  }

  // Pomodoro
  if (pomodoroStats.totalSessions === 0) {
    recs.push({
      id: "try-pomodoro",
      icon: "🍅",
      title: "Попробуйте Помодоро",
      text: "25 минут фокуса + 5 минут отдыха. Простая техника, которая помогает сохранить энергию и концентрацию.",
      category: "productivity",
      color: "#C4876C",
      priority: 4,
    });
  } else if (pomodoroStats.totalSessions >= 10) {
    recs.push({
      id: "pomodoro-master",
      icon: "🍅",
      title: "Мастер фокуса",
      text: `${pomodoroStats.totalSessions} сессий! Вы научились управлять своим вниманием. Это ценный навык.`,
      category: "productivity",
      color: "#8DB596",
      priority: 2,
    });
  }

  // Mood not tracked today
  const todayMood = moods.find((m) => m.date === d);
  if (!todayMood && new Date().getHours() >= 17) {
    recs.push({
      id: "track-mood",
      icon: "🌸",
      title: "Отметьте настроение",
      text: "Вечер — хорошее время, чтобы остановиться и спросить себя: как я сегодня?",
      category: "mindfulness",
      color: "#B88FA7",
      priority: 5,
    });
  }

  // Streak celebration
  if (profile.streak >= 7 && profile.streak < 14) {
    recs.push({
      id: "week-streak",
      icon: "🌟",
      title: "Неделя подряд!",
      text: `${profile.streak} дней — вы формируете устойчивую привычку заботиться о себе. Так держать!`,
      category: "personal",
      color: "#C4A86C",
      priority: 3,
    });
  } else if (profile.streak >= 30) {
    recs.push({
      id: "month-streak",
      icon: "🏔️",
      title: "Месяц силы!",
      text: `${profile.streak} дней — это настоящее достижение. Вы доказали себе, что можете.`,
      category: "personal",
      color: "#8DB596",
      priority: 1,
    });
  }

  // ─── Questionnaire-based recommendations ───

  if (!q.filled) {
    recs.push({
      id: "fill-questionnaire",
      icon: "📝",
      title: "Расскажите о себе",
      text: "Заполните анкету в профиле — и мы дадим персональные рекомендации именно для вас.",
      category: "personal",
      color: "#7EA8BE",
      priority: 8,
    });
    return recs.sort((a, b) => b.priority - a.priority);
  }

  // ── Stress ──

  if (q.stressLevel >= 4) {
    recs.push({
      id: "high-stress",
      icon: "🫂",
      title: "Высокий стресс",
      text: "Вы отметили высокий уровень стресса. Помните: просить о помощи — это проявление силы, а не слабости.",
      category: "wellbeing",
      color: "#9B8EC4",
      priority: 10,
    });

    if (q.relaxMethods.length > 0) {
      const methods = q.relaxMethods.slice(0, 3).join(", ").toLowerCase();
      recs.push({
        id: "stress-relax",
        icon: "🛁",
        title: "Ваши способы расслабления",
        text: `Вы упоминали, что вам помогает: ${methods}. Запланируйте одно из них сегодня — вы заслуживаете отдых.`,
        category: "wellbeing",
        color: "#7BAFB0",
        priority: 8,
      });
    }

    if (!habits.some((h) => h.title.toLowerCase().includes("медитац") || h.title.toLowerCase().includes("дыхан"))) {
      recs.push({
        id: "add-meditation",
        icon: "🧘",
        title: "Медитация при стрессе",
        text: "Даже 3 минуты осознанного дыхания снижают уровень кортизола. Попробуйте добавить эту привычку.",
        category: "mindfulness",
        color: "#9B8EC4",
        priority: 7,
      });
    }
  } else if (q.stressLevel <= 2) {
    recs.push({
      id: "low-stress",
      icon: "😌",
      title: "Вы в спокойствии",
      text: "Низкий уровень стресса — это прекрасная база для роста. Используйте это состояние для новых целей.",
      category: "wellbeing",
      color: "#8DB596",
      priority: 2,
    });
  }

  // ── Sleep ──

  if (q.sleepHours === "<5" || q.sleepHours === "5-6") {
    recs.push({
      id: "sleep-deficit",
      icon: "🌙",
      title: "Недостаток сна",
      text: "Вы спите меньше 7 часов. Сон — основа всего: энергии, настроения, концентрации. Попробуйте ложиться на 20 минут раньше.",
      category: "wellbeing",
      color: "#7EA8BE",
      priority: 9,
    });

    if (q.peakTime === "night") {
      recs.push({
        id: "night-owl-sleep",
        icon: "🦉",
        title: "Ночной тип и сон",
        text: "Вы продуктивны ночью, но спите мало. Попробуйте чёткий «дедлайн» для ночной работы — например, не позже 1:00.",
        category: "wellbeing",
        color: "#9B8EC4",
        priority: 8,
      });
    }
  } else if (q.sleepHours === "8-9" || q.sleepHours === ">9") {
    recs.push({
      id: "good-sleep",
      icon: "😴",
      title: "Отличный сон",
      text: "Вы спите достаточно — это отличный фундамент для продуктивности и хорошего настроения.",
      category: "wellbeing",
      color: "#8DB596",
      priority: 1,
    });
  }

  // ── Goals ──

  if (q.goals.includes("health") && (q.exerciseFrequency === "rarely" || q.exerciseFrequency === "never")) {
    recs.push({
      id: "health-exercise",
      icon: "🏃",
      title: "Здоровье и движение",
      text: "Здоровье — один из ваших приоритетов, но физическая активность пока невысока. Начните с 10-минутных прогулок — тело скажет спасибо.",
      category: "habits",
      color: "#C4876C",
      priority: 7,
    });
  }

  if (q.goals.includes("career") && completionRate < 50 && totalTasks >= 3) {
    recs.push({
      id: "career-tasks",
      icon: "📊",
      title: "Карьерный фокус",
      text: "Карьера — ваш приоритет, но много задач остаются незавершёнными. Попробуйте метод «3 важных дела дня».",
      category: "productivity",
      color: "#7EA8BE",
      priority: 7,
    });
  }

  if (q.goals.includes("relationships")) {
    if (!tasks.some((t) => t.category === "personal" && !t.completed)) {
      recs.push({
        id: "relationships-remind",
        icon: "💕",
        title: "Время для близких",
        text: "Отношения — ваш приоритет. Может, стоит добавить задачу «написать/позвонить близкому человеку»?",
        category: "personal",
        color: "#B88FA7",
        priority: 5,
      });
    }
  }

  if (q.goals.includes("selfdevelopment")) {
    const readingHabit = habits.find((h) => h.title.toLowerCase().includes("чтени") || h.title.toLowerCase().includes("книг"));
    if (readingHabit && readingHabit.streak >= 5) {
      recs.push({
        id: "reading-streak",
        icon: "📖",
        title: "Отличный читатель",
        text: `Стрик чтения — ${readingHabit.streak} дней! Это один из лучших способов расти. Продолжайте.`,
        category: "habits",
        color: "#8DB596",
        priority: 3,
      });
    } else if (!readingHabit) {
      recs.push({
        id: "add-reading",
        icon: "📚",
        title: "Чтение для роста",
        text: "Саморазвитие — ваш приоритет. 15 минут чтения в день — это 20+ книг в год. Добавьте эту привычку?",
        category: "habits",
        color: "#C4A86C",
        priority: 5,
      });
    }
  }

  if (q.goals.includes("creativity")) {
    recs.push({
      id: "creativity-time",
      icon: "🎨",
      title: "Пространство для творчества",
      text: "Выделите хотя бы 15 минут в день только для творчества — без целей, без давления. Просто позвольте себе творить.",
      category: "personal",
      color: "#B88FA7",
      priority: 4,
    });
  }

  if (q.goals.includes("finance")) {
    recs.push({
      id: "finance-habits",
      icon: "🌱",
      title: "Финансовые привычки",
      text: "Финансовая стабильность начинается с маленьких привычек. Попробуйте вести учёт расходов хотя бы неделю.",
      category: "productivity",
      color: "#8DB596",
      priority: 4,
    });
  }

  // ── Blockers ──

  if (q.productivityBlockers.includes("Прокрастинация")) {
    recs.push({
      id: "procrastination",
      icon: "⏳",
      title: "Против прокрастинации",
      text: "Вы знаете, что прокрастинация — ваш вызов. Попробуйте «правило 5 минут»: начните любое дело всего на 5 минут. Обычно этого хватает, чтобы войти в поток.",
      category: "productivity",
      color: "#C4A86C",
      priority: 7,
    });
  }

  if (q.productivityBlockers.includes("Отвлечения")) {
    if (pomodoroStats.totalSessions < 5) {
      recs.push({
        id: "distractions-pomodoro",
        icon: "🍅",
        title: "Фокус через Помодоро",
        text: "Отвлечения мешают вам? Помодоро-таймер создаёт «священные» 25 минут без отвлечений. Попробуйте хотя бы 2 сессии.",
        category: "productivity",
        color: "#C4876C",
        priority: 6,
      });
    }
  }

  if (q.productivityBlockers.includes("Усталость")) {
    recs.push({
      id: "fatigue-breaks",
      icon: "🫧",
      title: "Берегите энергию",
      text: "Усталость — это сигнал тела, не лень. Делайте перерывы каждые 50 минут, пейте воду и не забывайте есть.",
      category: "wellbeing",
      color: "#7BAFB0",
      priority: 7,
    });
  }

  if (q.productivityBlockers.includes("Неуверенность")) {
    recs.push({
      id: "confidence",
      icon: "🦋",
      title: "Вы способны на большее",
      text: "Неуверенность — это нормально. Попробуйте вести журнал маленьких побед: каждый вечер записывайте 3 вещи, которые получились.",
      category: "mindfulness",
      color: "#9B8EC4",
      priority: 6,
    });
  }

  if (q.productivityBlockers.includes("Перфекционизм")) {
    recs.push({
      id: "perfectionism",
      icon: "🌸",
      title: "Отпустите идеал",
      text: "«Сделано» всегда лучше «идеально». Поставьте себе правило: отправлять/завершать на 80% — и переходить дальше.",
      category: "mindfulness",
      color: "#B88FA7",
      priority: 6,
    });
  }

  if (q.productivityBlockers.includes("Одиночество")) {
    recs.push({
      id: "loneliness",
      icon: "🤝",
      title: "Вы не одиноки",
      text: "Одиночество — один из ваших вызовов. Попробуйте начать с малого: написать кому-то, кто давно не слышал от вас.",
      category: "personal",
      color: "#7EA8BE",
      priority: 7,
    });
  }

  if (q.productivityBlockers.includes("Стресс") && q.stressLevel < 4) {
    recs.push({
      id: "stress-blocker",
      icon: "🌊",
      title: "Управление стрессом",
      text: "Стресс мешает продуктивности. Техника 4-7-8: вдох 4 секунды, задержка 7, выдох 8. Повторите 3 раза.",
      category: "wellbeing",
      color: "#7BAFB0",
      priority: 6,
    });
  }

  // ── Desired habits ──

  if (q.desiredHabits.length > 0) {
    const existingHabitNames = habits.map((h) => h.title.toLowerCase());
    const missingHabits = q.desiredHabits.filter(
      (dh) => !existingHabitNames.some((eh) => eh.includes(dh.toLowerCase()))
    );

    if (missingHabits.length > 0) {
      recs.push({
        id: "missing-habits",
        icon: "🌿",
        title: "Не забудьте о мечтах",
        text: `Вы хотели развить: ${missingHabits.slice(0, 3).join(", ").toLowerCase()}. Может, сегодня — хороший день начать?`,
        category: "habits",
        color: "#8DB596",
        priority: 5,
      });
    }
  }

  // ── Peak time ──

  const hour = new Date().getHours();
  if (q.peakTime === "morning" && hour >= 6 && hour < 10 && habitsToday < habits.length) {
    recs.push({
      id: "morning-peak",
      icon: "🌅",
      title: "Ваше утро — ваша сила",
      text: "Утро — ваше самое продуктивное время. Сделайте сейчас то, что требует максимальной концентрации.",
      category: "productivity",
      color: "#C4A86C",
      priority: 8,
    });
  }

  // ── Exercise frequency ──

  if (q.exerciseFrequency === "daily" || q.exerciseFrequency === "3-4") {
    const fitnessHabit = habits.find((h) => h.category === "fitness");
    if (fitnessHabit && fitnessHabit.streak >= 7) {
      recs.push({
        id: "exercise-streak",
        icon: "🏔️",
        title: "Спортивная серия",
        text: `${fitnessHabit.streak} дней тренировок! Движение — ваш источник энергии. Продолжайте в своём ритме.`,
        category: "habits",
        color: "#8DB596",
        priority: 3,
      });
    }
  }

  // ── Motivation type ──

  if (q.motivation === "results" && completionRate >= 50) {
    recs.push({
      id: "results-motivation",
      icon: "📈",
      title: "Ваши результаты растут",
      text: `${completionRate}% задач выполнено — вы видите результат, и он мотивирует. Так держать!`,
      category: "personal",
      color: "#8DB596",
      priority: 3,
    });
  }

  if (q.motivation === "streaks") {
    const longestStreak = Math.max(...habits.map((h) => h.streak), 0);
    if (longestStreak >= 5) {
      recs.push({
        id: "streak-motivation",
        icon: "🔥",
        title: "Серия не прерывается!",
        text: `Самая длинная серия — ${longestStreak} дней. Вы знаете, что серии мотивируют вас, так не останавливайтесь!`,
        category: "habits",
        color: "#C4876C",
        priority: 4,
      });
    }
  }

  if (q.motivation === "rewards") {
    recs.push({
      id: "rewards-motivation",
      icon: "🎁",
      title: `У вас ${profile.coins} монет`,
      text: "Награды мотивируют вас! Продолжайте выполнять задачи и привычки — каждое действие приносит XP и монеты.",
      category: "personal",
      color: "#C4A86C",
      priority: 3,
    });
  }

  if (q.motivation === "growth") {
    recs.push({
      id: "growth-motivation",
      icon: "🌱",
      title: "Путь роста",
      text: `Уровень ${profile.level} — каждый день вы становитесь лучшей версией себя. Рост — это процесс, а не результат.`,
      category: "personal",
      color: "#8DB596",
      priority: 3,
    });
  }

  // ── Month goals ──

  if (q.monthGoals && q.monthGoals.length > 10) {
    recs.push({
      id: "month-goals",
      icon: "🎯",
      title: "Помните о цели",
      text: `Ваша цель: «${q.monthGoals.slice(0, 80)}${q.monthGoals.length > 80 ? "..." : ""}». Держите её в фокусе — маленькие шаги ведут к большим результатам.`,
      category: "personal",
      color: "#7EA8BE",
      priority: 6,
    });
  }

  // ── Mindfulness ──

  if (q.goals.includes("mindfulness") || q.desiredHabits.includes("Медитация") || q.desiredHabits.includes("Благодарность")) {
    const meditationHabit = habits.find((h) => h.title.toLowerCase().includes("медитац") || h.category === "mindfulness");
    if (meditationHabit && meditationHabit.streak >= 7) {
      recs.push({
        id: "mindfulness-progress",
        icon: "🧘",
        title: "Путь осознанности",
        text: `${meditationHabit.streak} дней практики осознанности. Исследования показывают: 8 недель медитации меняют структуру мозга. Вы на пути!`,
        category: "mindfulness",
        color: "#9B8EC4",
        priority: 3,
      });
    }
  }

  return recs.sort((a, b) => b.priority - a.priority);
}

// ─── Category labels for display ───

export const categoryMeta: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  wellbeing: { label: "Благополучие", icon: "💛", color: "#C4A86C", bg: "#F8F3EA" },
  productivity: { label: "Продуктивность", icon: "📊", color: "#7EA8BE", bg: "#EEF3F6" },
  habits: { label: "Привычки", icon: "🔄", color: "#8DB596", bg: "#EDF5EF" },
  mindfulness: { label: "Осознанность", icon: "🧘", color: "#9B8EC4", bg: "#F2EFF8" },
  energy: { label: "Энергия", icon: "⚡", color: "#C4876C", bg: "#FAF0EB" },
  personal: { label: "Личное", icon: "🌸", color: "#B88FA7", bg: "#F8EFF3" },
};
