import type { Habit } from "../components/use-app-store";

/**
 * Постоянство вместо серии подряд.
 *
 * Счётчик «дней подряд» наказывает за один пропуск обнулением — для приложения
 * про спокойствие это слишком. Здесь скользящее окно: «22 из последних 30».
 * Падать некуда, а картина честнее: один пропущенный день почти ничего не меняет.
 */

export function lastNDates(n: number, from = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

export interface Consistency {
  /** Сколько дней из окна привычка выполнена */
  done: number;
  /** Размер окна — не больше, чем прошло с появления привычки */
  window: number;
  percent: number;
  /** Сколько дней подряд сейчас — показываем мелко, как факт, а не как цель */
  current: number;
}

export function consistency(habit: Habit, windowSize = 30, today = new Date()): Consistency {
  const days = lastNDates(windowSize, today);
  const completed = new Set(habit.completedDates);
  const frozen = new Set(habit.frozenDates ?? []);

  // Окно не длиннее, чем живёт привычка: новая привычка не должна выглядеть провальной
  const earliest = habit.completedDates.length ? habit.completedDates.slice().sort()[0] : days[days.length - 1];
  const effective = days.filter((d) => d >= earliest);
  const window = Math.max(effective.length, 1);

  // Замороженные дни не считаются ни выполненными, ни пропущенными
  const counted = effective.filter((d) => !frozen.has(d));
  const done = counted.filter((d) => completed.has(d)).length;
  const denom = Math.max(counted.length, 1);

  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (frozen.has(d)) continue;
    if (completed.has(d)) current++;
    else if (i === days.length - 1) continue; // сегодня ещё можно выполнить
    else break;
  }

  return { done, window, percent: Math.round((done / denom) * 100), current };
}

/** «22 из 30» либо «3 из 5»; привычка без единой отметки — просто «новая» */
export function consistencyLabel(c: Consistency): string {
  return c.done === 0 && c.window <= 1 ? "новая" : `${c.done} из ${c.window}`;
}

/** Среднее постоянство по привычкам, у которых уже есть хотя бы одна отметка */
export function averageConsistency(habits: Habit[]): number {
  const started = habits.filter((h) => h.completedDates.length > 0);
  if (!started.length) return 0;
  return Math.round(started.reduce((sum, h) => sum + consistency(h).percent, 0) / started.length);
}
