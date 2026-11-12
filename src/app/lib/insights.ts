import type { Habit, MoodEntry, AnxietyEntry } from "../components/use-app-store";

/**
 * Наблюдения: приложение отвечает, а не только записывает.
 *
 * Правило честности: пока данных мало, наблюдений нет вовсе.
 * На пяти записях любая «связь» — выдумка, поэтому каждое наблюдение
 * требует минимального числа дней с обеих сторон сравнения
 * и заметной разницы. Формулировки — «в дни, когда…», без «потому что»:
 * это совпадения в данных, а не доказанные причины.
 */

export interface Insight {
  id: string;
  text: string;
  /** На скольких днях основано — показываем пользователю */
  basis: string;
}

export interface InsightsResult {
  insights: Insight[];
  /** Сколько дней с настроением уже есть и сколько нужно для первых наблюдений */
  daysCollected: number;
  daysNeeded: number;
}

/** Условная «светлость» настроения: 1 — тяжело, 5 — хорошо */
const VALENCE: Record<string, number> = {
  "Радость": 5, "Энергия": 5, "Спокойствие": 4, "Задумчивость": 3,
  "Усталость": 2, "Грусть": 2, "Раздражение": 2, "Тревога": 1,
};

const WEEKDAYS = ["воскресеньям", "понедельникам", "вторникам", "средам", "четвергам", "пятницам", "субботам"];

const MIN_MOOD_DAYS = 14;  // до этого молчим
const MIN_GROUP = 4;       // минимум дней в каждой из сравниваемых групп
const MIN_DIFF = 0.6;      // минимальная разница средней оценки (шкала 1–5)

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function computeInsights(habits: Habit[], moods: MoodEntry[], anxiety: AnxietyEntry[]): InsightsResult {
  const moodByDate = new Map<string, number>();
  for (const m of moods) {
    const v = VALENCE[m.mood];
    if (v) moodByDate.set(m.date, v);
  }
  const moodDays = [...moodByDate.keys()];
  const result: InsightsResult = { insights: [], daysCollected: moodDays.length, daysNeeded: MIN_MOOD_DAYS };
  if (moodDays.length < MIN_MOOD_DAYS) return result;

  const found: (Insight & { strength: number })[] = [];

  // 1. Привычка ↔ настроение: сравниваем дни с привычкой и без неё
  for (const h of habits) {
    const done = new Set(h.completedDates);
    const withH: number[] = [];
    const withoutH: number[] = [];
    for (const d of moodDays) (done.has(d) ? withH : withoutH).push(moodByDate.get(d)!);
    if (withH.length < MIN_GROUP || withoutH.length < MIN_GROUP) continue;
    const diff = avg(withH) - avg(withoutH);
    if (diff >= MIN_DIFF) {
      found.push({
        id: `habit-${h.id}`,
        text: `В дни, когда вы отмечаете «${h.title}», настроение обычно лучше.`,
        basis: `${withH.length} дн. с привычкой и ${withoutH.length} без`,
        strength: diff,
      });
    }
  }

  // 2. День недели ↔ настроение
  const byWeekday: number[][] = [[], [], [], [], [], [], []];
  for (const d of moodDays) byWeekday[new Date(d + "T12:00:00").getDay()].push(moodByDate.get(d)!);
  const overall = avg([...moodByDate.values()]);
  byWeekday.forEach((vals, wd) => {
    // для дня недели нужно минимум четыре таких дня — на трёх это ещё случайность
    if (vals.length < 4) return;
    const diff = avg(vals) - overall;
    if (diff <= -MIN_DIFF) {
      found.push({
        id: `weekday-low-${wd}`,
        text: `По ${WEEKDAYS[wd]} настроение чаще ниже обычного.`,
        basis: `${vals.length} таких дней в записях`,
        strength: -diff,
      });
    }
  });

  // 3. День недели ↔ тревога
  if (anxiety.length >= 6) {
    const anxByWd = [0, 0, 0, 0, 0, 0, 0];
    for (const a of anxiety) anxByWd[new Date(a.date + "T12:00:00").getDay()]++;
    const top = anxByWd.indexOf(Math.max(...anxByWd));
    const share = anxByWd[top] / anxiety.length;
    if (anxByWd[top] >= 4 && share >= 0.35) {
      found.push({
        id: `anx-weekday-${top}`,
        text: `Тревога чаще записана по ${WEEKDAYS[top]}.`,
        basis: `${anxByWd[top]} из ${anxiety.length} записей`,
        strength: share * 2,
      });
    }
  }

  // 4. Повторяющийся триггер тревоги
  if (anxiety.length >= 5) {
    const counts = new Map<string, number>();
    for (const a of anxiety) {
      const key = a.trigger?.trim();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 3 && top[1] / anxiety.length >= 0.4) {
      found.push({
        id: "anx-trigger",
        text: `Самая частая причина тревоги в записях — «${top[0]}».`,
        basis: `${top[1]} из ${anxiety.length} записей`,
        strength: top[1] / anxiety.length,
      });
    }
  }

  found.sort((a, b) => b.strength - a.strength);
  result.insights = found.slice(0, 3).map(({ strength: _s, ...rest }) => rest);
  return result;
}
