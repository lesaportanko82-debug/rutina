/**
 * Ключ разбираемой недели — дата её понедельника.
 * Берём «вчера»: разбор в воскресенье и в понедельник относится к одной и той же неделе.
 */
export function reviewWeekKey(now = new Date()): string {
  const x = new Date(now);
  x.setDate(x.getDate() - 1);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().split("T")[0];
}

export function weekReviewDone(): boolean {
  try { return localStorage.getItem("routine_week_review") === reviewWeekKey(); } catch { return false; }
}

export function markWeekReviewDone(): void {
  try { localStorage.setItem("routine_week_review", reviewWeekKey()); } catch { /* ignore */ }
}
