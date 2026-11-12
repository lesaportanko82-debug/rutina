/**
 * PDF Export — generates a beautifully formatted PDF report with charts
 * Uses canvas for Cyrillic text rendering + jspdf for PDF creation
 * Supports period filtering: week / month / all time
 */

import jsPDF from "jspdf";

// ─── Types ───
export type PdfPeriod = "week" | "month" | "all";

export interface ExportData {
  profile: { name: string; level: number; xp: number; xpToNext: number; coins: number; streak: number };
  questionnaire: { filled: boolean; name: string; goals: string[]; monthGoals: string; supportStyle: string };
  tasks: { id: string; title: string; completed: boolean; category: string; priority: string; createdAt: string }[];
  habits: { id: string; title: string; icon: string; streak: number; bestStreak: number; completedDates: string[]; category: string }[];
  moods: { id: string; date: string; mood: string; note?: string; energy: number }[];
  journalEntries: { id: string; date: string; text: string; mood?: string }[];
  plantState: { growthPoints: number; health: number; waterLevel: number; happiness: number; name: string; totalInteractions: number; createdAt: string };
  softAchievements: { id: string; title: string; icon: string; unlocked: boolean; unlockedAt?: string; category: string; description: string }[];
  anxietyEntries: { id: string; date: string; level: number; trigger: string; notes?: string }[];
  worryEntries: { id: string; date: string; worry: string; probability: number; reviewed: boolean; happened?: boolean }[];
  pomodoroStats: { totalSessions: number; totalMinutes: number; streakDays: number };
  sleepEntries: { id: string; date: string; hours: number; quality: number }[];
}

// ─── Color palette ───
const C = {
  bg: "#FAF8F5", card: "#FFFFFF",
  sage: "#8DB596", sageDark: "#6B8F71",
  lavender: "#9B8EC4", terracotta: "#C4876C",
  dustyBlue: "#7EA8BE", teal: "#7BAFB0",
  gold: "#C4A86C", rose: "#B88FA7",
  text: "#2D3436", textMuted: "#636E72", textFaint: "#A0AAB0",
  border: "#E8E4DF",
  great: "#8DB596", good: "#7BAFB0", okay: "#C4A86C", bad: "#C4876C", awful: "#B88FA7",
};

// ─── Date helpers ───
function getDateThreshold(period: PdfPeriod): Date {
  const now = new Date();
  if (period === "week") { now.setDate(now.getDate() - 7); return now; }
  if (period === "month") { now.setMonth(now.getMonth() - 1); return now; }
  return new Date(0);
}

function dateInPeriod(dateStr: string, threshold: Date): boolean {
  try { return new Date(dateStr) >= threshold; } catch { return true; }
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  } catch { return dateStr; }
}

function formatDateFull(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  } catch { return dateStr; }
}

const periodLabels: Record<PdfPeriod, string> = { week: "За неделю", month: "За месяц", all: "За всё время" };
const moodLabels: Record<string, string> = { great: "Отличное", good: "Хорошее", okay: "Нормальное", bad: "Плохое", awful: "Ужасное" };
const moodValues: Record<string, number> = { great: 5, good: 4, okay: 3, bad: 2, awful: 1 };
const moodColors: Record<string, string> = { great: C.great, good: C.good, okay: C.gold, bad: C.bad, awful: C.awful };
const catLabels: Record<string, string> = { work: "Работа", personal: "Личное", health: "Здоровье", study: "Учёба", productivity: "Продуктивность", mindfulness: "Осознанность", fitness: "Фитнес" };
const priLabels: Record<string, string> = { low: "Низкий", medium: "Средний", high: "Высокий" };

// ─── Filter data by period ───
function filterData(raw: ExportData, period: PdfPeriod): ExportData {
  const t = getDateThreshold(period);
  return {
    ...raw,
    tasks: raw.tasks.filter(x => dateInPeriod(x.createdAt, t)),
    moods: raw.moods.filter(x => dateInPeriod(x.date, t)),
    journalEntries: raw.journalEntries.filter(x => dateInPeriod(x.date, t)),
    anxietyEntries: raw.anxietyEntries.filter(x => dateInPeriod(x.date, t)),
    worryEntries: raw.worryEntries.filter(x => dateInPeriod(x.date, t)),
    sleepEntries: (raw.sleepEntries || []).filter(x => dateInPeriod(x.date, t)),
    habits: raw.habits.map(h => ({
      ...h,
      completedDates: h.completedDates.filter(d => dateInPeriod(d, t)),
    })),
  };
}

/** Counts how many items each period has */
export function getPeriodCounts(data: ExportData): Record<PdfPeriod, number> {
  const count = (period: PdfPeriod) => {
    const t = getDateThreshold(period);
    return data.moods.filter(x => dateInPeriod(x.date, t)).length +
      data.tasks.filter(x => dateInPeriod(x.createdAt, t)).length +
      data.journalEntries.filter(x => dateInPeriod(x.date, t)).length +
      data.anxietyEntries.filter(x => dateInPeriod(x.date, t)).length;
  };
  return { week: count("week"), month: count("month"), all: count("all") };
}

// ═══════════════════════════════════════════════════════
// Canvas PDF Renderer with Charts
// ═══════════════════════════════════════════════════════

class PDFRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pdf: jsPDF;
  private y = 0;
  private pageNum = 0;
  private readonly W = 595;
  private readonly H = 842;
  private readonly S = 2;
  private readonly M = 40;
  private readonly CW: number;
  private readonly PB: number;
  private period: PdfPeriod;

  constructor(period: PdfPeriod) {
    this.CW = this.W - this.M * 2;
    this.PB = this.H - 60;
    this.period = period;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.W * this.S;
    this.canvas.height = this.H * this.S;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.scale(this.S, this.S);
    this.pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    this.pageNum = 1;
    this.clearPage();
  }

  private clearPage() {
    this.ctx.fillStyle = C.bg;
    this.ctx.fillRect(0, 0, this.W, this.H);
    this.y = this.M;
  }

  private flushPage() {
    this.ctx.fillStyle = C.textFaint;
    this.ctx.font = "9px Inter, system-ui, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(`— ${this.pageNum} —`, this.W / 2, this.H - 25);
    this.ctx.textAlign = "left";
    const img = this.canvas.toDataURL("image/jpeg", 0.92);
    if (this.pageNum > 1) this.pdf.addPage();
    this.pdf.addImage(img, "JPEG", 0, 0, this.W, this.H);
    this.pageNum++;
    this.clearPage();
  }

  private ensure(h: number) { if (this.y + h > this.PB) this.flushPage(); }

  // ─── Drawing primitives ───
  private subtitle(text: string) {
    this.ensure(35);
    this.ctx.font = "600 14px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.sageDark;
    this.ctx.fillText(text, this.M, this.y + 14);
    this.ctx.strokeStyle = C.sage + "40";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.M, this.y + 20);
    this.ctx.lineTo(this.M + this.CW, this.y + 20);
    this.ctx.stroke();
    this.y += 28;
  }

  private text(text: string, opts?: { bold?: boolean; color?: string; size?: number; indent?: number }) {
    const sz = opts?.size || 11, ind = opts?.indent || 0;
    const mw = this.CW - ind, lh = sz * 1.5;
    this.ctx.font = `${opts?.bold ? "600" : "400"} ${sz}px Inter, system-ui, sans-serif`;
    this.ctx.fillStyle = opts?.color || C.text;
    for (const line of this.wrap(text, mw)) {
      this.ensure(lh + 2);
      this.ctx.fillText(line, this.M + ind, this.y + sz);
      this.y += lh;
    }
  }

  private kv(key: string, value: string, ind = 0) {
    this.ensure(18);
    this.ctx.font = "500 10px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.textMuted;
    this.ctx.fillText(key + ":", this.M + ind, this.y + 10);
    const kw = this.ctx.measureText(key + ": ").width;
    this.ctx.fillStyle = C.text;
    this.ctx.fillText(value, this.M + ind + kw, this.y + 10);
    this.y += 16;
  }

  private sp(h = 10) { this.y += h; }

  private card(cb: () => void) {
    const sY = this.y;
    this.y += 12;
    cb();
    this.y += 12;
    const eY = this.y;
    this.ctx.save();
    this.ctx.globalCompositeOperation = "destination-over";
    this.rr(this.M - 4, sY, this.CW + 8, eY - sY, 10);
    this.ctx.fillStyle = C.card;
    this.ctx.fill();
    this.ctx.strokeStyle = C.border;
    this.ctx.lineWidth = 0.5;
    this.ctx.stroke();
    this.ctx.restore();
    this.sp(6);
  }

  private divider() {
    this.ensure(12);
    this.ctx.strokeStyle = C.border;
    this.ctx.lineWidth = 0.5;
    this.ctx.setLineDash([3, 3]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.M + 20, this.y + 6);
    this.ctx.lineTo(this.M + this.CW - 20, this.y + 6);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.y += 14;
  }

  private rr(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  private wrap(text: string, maxW: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (this.ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }

  // ═══════════════════════════════════════════════════
  //  CHART DRAWING METHODS
  // ═══════════════════════════════════════════════════

  /**
   * Line chart — draws a smooth line chart with area fill
   * @param points Array of { label, value }
   * @param height Chart height
   * @param color Line/area color
   * @param title Chart title
   * @param yLabel Y-axis label
   * @param minVal / maxVal — axis range
   */
  private drawLineChart(
    points: { label: string; value: number }[],
    height: number,
    color: string,
    title: string,
    yLabel: string,
    minVal: number,
    maxVal: number,
  ) {
    if (points.length < 2) return;
    this.ensure(height + 50);

    const x0 = this.M + 30; // left axis offset
    const chartW = this.CW - 40;
    const chartH = height;
    const topY = this.y + 24;

    // Title
    this.ctx.font = "600 10px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.text;
    this.ctx.fillText(title, this.M + 8, this.y + 12);
    this.ctx.font = "400 8px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.textFaint;
    this.ctx.fillText(yLabel, this.M + this.ctx.measureText(title).width + 16, this.y + 12);

    // Grid lines
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const gy = topY + (i / gridLines) * chartH;
      this.ctx.strokeStyle = C.border;
      this.ctx.lineWidth = 0.3;
      this.ctx.beginPath();
      this.ctx.moveTo(x0, gy);
      this.ctx.lineTo(x0 + chartW, gy);
      this.ctx.stroke();
      // Y-axis labels
      const val = maxVal - (i / gridLines) * (maxVal - minVal);
      this.ctx.font = "400 7px Inter, system-ui, sans-serif";
      this.ctx.fillStyle = C.textFaint;
      this.ctx.textAlign = "right";
      this.ctx.fillText(val.toFixed(val % 1 === 0 ? 0 : 1), x0 - 4, gy + 3);
    }
    this.ctx.textAlign = "left";

    // Plot points
    const getXY = (i: number) => ({
      px: x0 + (i / (points.length - 1)) * chartW,
      py: topY + (1 - (points[i].value - minVal) / (maxVal - minVal)) * chartH,
    });

    // Area fill
    this.ctx.beginPath();
    const first = getXY(0);
    this.ctx.moveTo(first.px, topY + chartH);
    this.ctx.lineTo(first.px, first.py);
    for (let i = 1; i < points.length; i++) {
      const prev = getXY(i - 1), curr = getXY(i);
      const cpx = (prev.px + curr.px) / 2;
      this.ctx.bezierCurveTo(cpx, prev.py, cpx, curr.py, curr.px, curr.py);
    }
    const last = getXY(points.length - 1);
    this.ctx.lineTo(last.px, topY + chartH);
    this.ctx.closePath();
    this.ctx.fillStyle = color + "15";
    this.ctx.fill();

    // Line
    this.ctx.beginPath();
    this.ctx.moveTo(first.px, first.py);
    for (let i = 1; i < points.length; i++) {
      const prev = getXY(i - 1), curr = getXY(i);
      const cpx = (prev.px + curr.px) / 2;
      this.ctx.bezierCurveTo(cpx, prev.py, cpx, curr.py, curr.px, curr.py);
    }
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Dots
    for (let i = 0; i < points.length; i++) {
      const { px, py } = getXY(i);
      this.ctx.beginPath();
      this.ctx.arc(px, py, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = C.card;
      this.ctx.fill();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    // X-axis labels (show up to ~12)
    const step = Math.max(1, Math.floor(points.length / 12));
    this.ctx.font = "400 6.5px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.textFaint;
    this.ctx.textAlign = "center";
    for (let i = 0; i < points.length; i += step) {
      const { px } = getXY(i);
      this.ctx.fillText(points[i].label, px, topY + chartH + 12);
    }
    this.ctx.textAlign = "left";

    this.y = topY + chartH + 20;
  }

  /**
   * Horizontal bar chart
   */
  private drawBarChart(
    items: { label: string; value: number; color: string }[],
    title: string,
    maxVal?: number,
  ) {
    if (items.length === 0) return;
    const barH = 14, gap = 6;
    const totalH = items.length * (barH + gap) + 30;
    this.ensure(totalH);

    this.ctx.font = "600 10px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.text;
    this.ctx.fillText(title, this.M + 8, this.y + 12);
    this.y += 22;

    const max = maxVal || Math.max(...items.map(i => i.value), 1);
    const barMaxW = this.CW - 120;

    for (const item of items) {
      this.ensure(barH + gap + 4);
      // Label
      this.ctx.font = "500 9px Inter, system-ui, sans-serif";
      this.ctx.fillStyle = C.text;
      this.ctx.fillText(item.label, this.M + 8, this.y + barH - 3);

      // Bar bg
      const barX = this.M + 100;
      this.rr(barX, this.y, barMaxW, barH, 4);
      this.ctx.fillStyle = C.border + "60";
      this.ctx.fill();

      // Bar fill
      const fillW = Math.max(4, (item.value / max) * barMaxW);
      this.rr(barX, this.y, fillW, barH, 4);
      this.ctx.fillStyle = item.color;
      this.ctx.fill();

      // Value label
      this.ctx.font = "600 8px Inter, system-ui, sans-serif";
      this.ctx.fillStyle = fillW > 30 ? "#fff" : C.text;
      this.ctx.fillText(`${item.value}`, barX + (fillW > 30 ? fillW - 20 : fillW + 6), this.y + barH - 3);

      this.y += barH + gap;
    }
    this.sp(4);
  }

  /**
   * Donut / Pie chart
   */
  private drawDonutChart(
    slices: { label: string; value: number; color: string }[],
    title: string,
    size = 90,
  ) {
    const total = slices.reduce((s, x) => s + x.value, 0);
    if (total === 0) return;
    this.ensure(size + 60);

    this.ctx.font = "600 10px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.text;
    this.ctx.fillText(title, this.M + 8, this.y + 12);
    this.y += 22;

    const cx = this.M + size / 2 + 10;
    const cy = this.y + size / 2;
    const r = size / 2 - 4;
    const ir = r * 0.55; // inner radius for donut

    let angle = -Math.PI / 2;
    for (const slice of slices) {
      const sliceAngle = (slice.value / total) * Math.PI * 2;
      // Outer arc
      this.ctx.beginPath();
      this.ctx.moveTo(cx + Math.cos(angle) * ir, cy + Math.sin(angle) * ir);
      this.ctx.arc(cx, cy, r, angle, angle + sliceAngle);
      this.ctx.arc(cx, cy, ir, angle + sliceAngle, angle, true);
      this.ctx.closePath();
      this.ctx.fillStyle = slice.color;
      this.ctx.fill();
      angle += sliceAngle;
    }

    // Center text
    this.ctx.font = "bold 16px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.text;
    this.ctx.textAlign = "center";
    this.ctx.fillText(`${total}`, cx, cy + 4);
    this.ctx.font = "400 7px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.textMuted;
    this.ctx.fillText("записей", cx, cy + 14);
    this.ctx.textAlign = "left";

    // Legend
    const legendX = this.M + size + 30;
    let legendY = this.y + 8;
    for (const slice of slices) {
      const pct = Math.round((slice.value / total) * 100);
      this.ctx.beginPath();
      this.ctx.arc(legendX, legendY + 4, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = slice.color;
      this.ctx.fill();
      this.ctx.font = "500 9px Inter, system-ui, sans-serif";
      this.ctx.fillStyle = C.text;
      this.ctx.fillText(`${slice.label}  ${slice.value} (${pct}%)`, legendX + 10, legendY + 7);
      legendY += 16;
    }

    this.y += size + 10;
  }

  /**
   * Mini sparkline (inline)
   */
  private drawSparkline(values: number[], x: number, y: number, w: number, h: number, color: string) {
    if (values.length < 2) return;
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    this.ctx.beginPath();
    values.forEach((v, i) => {
      const px = x + (i / (values.length - 1)) * w;
      const py = y + h - ((v - min) / range) * h;
      i === 0 ? this.ctx.moveTo(px, py) : this.ctx.lineTo(px, py);
    });
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  // ═══════════════════════════════════════════════════
  //  PAGE BUILDERS
  // ═══════════════════════════════════════════════════

  private buildCover(data: ExportData) {
    // Header gradient
    const grad = this.ctx.createLinearGradient(0, 0, this.W, 180);
    grad.addColorStop(0, C.sage);
    grad.addColorStop(1, C.teal);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.W, 180);

    // Decorative circles
    this.ctx.globalAlpha = 0.08;
    this.ctx.beginPath();
    this.ctx.arc(this.W - 80, 60, 100, 0, Math.PI * 2);
    this.ctx.fillStyle = "#fff";
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(this.W - 40, 140, 50, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    // Title
    this.ctx.font = "bold 28px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillText("Мой отчёт о прогрессе", this.M, 75);

    // Subtitle
    this.ctx.font = "400 14px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = "rgba(255,255,255,0.85)";
    const name = data.questionnaire.filled && data.questionnaire.name ? data.questionnaire.name : data.profile.name;
    this.ctx.fillText(`${name} · ${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`, this.M, 105);

    // Period badge
    this.ctx.font = "500 11px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = "rgba(255,255,255,0.5)";
    this.ctx.fillText(`${periodLabels[this.period]} · Routine`, this.M, 150);

    this.y = 200;

    // Quick stats row
    this.card(() => {
      const stats = [
        { label: "Уровень", value: `${data.profile.level}`, color: C.sage },
        { label: "XP", value: `${data.profile.xp}/${data.profile.xpToNext}`, color: C.lavender },
        { label: "Серия", value: `${data.profile.streak} дн.`, color: C.terracotta },
        { label: "Монеты", value: `${data.profile.coins}`, color: C.gold },
      ];
      const colW = this.CW / stats.length;
      stats.forEach((s, i) => {
        const x = this.M + i * colW;
        this.ctx.font = "bold 20px Inter, system-ui, sans-serif";
        this.ctx.fillStyle = s.color;
        this.ctx.fillText(s.value, x + 10, this.y + 20);
        this.ctx.font = "400 9px Inter, system-ui, sans-serif";
        this.ctx.fillStyle = C.textMuted;
        this.ctx.fillText(s.label, x + 10, this.y + 34);
      });
      this.y += 42;
    });

    this.sp(5);

    // Plant companion
    if (data.plantState.growthPoints > 0) {
      this.card(() => {
        this.ctx.font = "bold 12px Inter, system-ui, sans-serif";
        this.ctx.fillStyle = C.text;
        this.ctx.fillText(`Растение-компаньон: ${data.plantState.name}`, this.M + 8, this.y + 12);
        this.y += 22;
        this.kv("Очки роста", `${data.plantState.growthPoints} GP`, 8);
        this.kv("Здоровье", `${data.plantState.health}%`, 8);
        this.kv("Вода", `${data.plantState.waterLevel}%`, 8);
        this.kv("Счастье", `${data.plantState.happiness}%`, 8);
        this.kv("Взаимодействий", `${data.plantState.totalInteractions}`, 8);
        if (data.plantState.createdAt) {
          const days = Math.max(1, Math.round((Date.now() - new Date(data.plantState.createdAt + "T12:00:00").getTime()) / 86400000));
          this.kv("С вами", `${days} дн.`, 8);
        }
      });
    }
  }

  private buildMoodCharts(data: ExportData) {
    if (data.moods.length < 2) return;
    this.sp(8);
    this.subtitle("Аналитика настроения");

    // Sort by date
    const sorted = [...data.moods].sort((a, b) => a.date.localeCompare(b.date));

    // Mood trend line chart
    const moodPoints = sorted.map(m => ({
      label: formatDateShort(m.date),
      value: moodValues[m.mood] || 3,
    }));
    this.card(() => {
      this.drawLineChart(moodPoints, 120, C.lavender, "Динамика настроения", "1–5", 0.5, 5.5);
    });

    // Energy trend line chart
    const energyPoints = sorted.map(m => ({
      label: formatDateShort(m.date),
      value: m.energy,
    }));
    this.card(() => {
      this.drawLineChart(energyPoints, 100, C.dustyBlue, "Динамика энергии", "1–5", 0.5, 5.5);
    });

    // Mood distribution donut
    const moodCounts: Record<string, number> = {};
    data.moods.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1; });
    const slices = Object.entries(moodCounts).map(([mood, count]) => ({
      label: moodLabels[mood] || mood,
      value: count,
      color: moodColors[mood] || C.textFaint,
    }));
    this.card(() => {
      this.drawDonutChart(slices, "Распределение настроений", 90);
    });

    // Avg energy
    const avgEnergy = data.moods.reduce((s, m) => s + m.energy, 0) / data.moods.length;
    const avgMood = sorted.reduce((s, m) => s + (moodValues[m.mood] || 3), 0) / sorted.length;
    this.text(`Средняя энергия: ${avgEnergy.toFixed(1)}/5 · Среднее настроение: ${avgMood.toFixed(1)}/5`, { color: C.textMuted, size: 10, indent: 8 });
    this.sp(4);
  }

  private buildHabitCharts(data: ExportData) {
    const active = data.habits.filter(h => h.completedDates.length > 0);
    if (active.length === 0) return;
    this.sp(8);
    this.subtitle("Аналитика привычек");

    // Bar chart — total completions per habit
    const bars = active.map(h => ({
      label: `${h.icon} ${h.title}`,
      value: h.completedDates.length,
      color: C.sage,
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    this.card(() => {
      this.drawBarChart(bars, "Выполнения привычек (за период)");
    });

    // Streak comparison
    const streakBars = data.habits.filter(h => h.bestStreak > 0).map(h => ({
      label: `${h.icon} ${h.title}`,
      value: h.bestStreak,
      color: C.terracotta,
    })).sort((a, b) => b.value - a.value).slice(0, 8);

    if (streakBars.length > 0) {
      this.card(() => {
        this.drawBarChart(streakBars, "Лучшие серии (дней)");
      });
    }

    // Habit completion heatmap-style sparklines
    if (active.length > 0 && active.length <= 6) {
      this.card(() => {
        this.ctx.font = "600 10px Inter, system-ui, sans-serif";
        this.ctx.fillStyle = C.text;
        this.ctx.fillText("Тренды выполнений", this.M + 8, this.y + 12);
        this.y += 20;

        for (const h of active.slice(0, 6)) {
          this.ensure(28);
          // Group completions by date — count per day for last 30 days
          const now = new Date();
          const vals: number[] = [];
          for (let d = 29; d >= 0; d--) {
            const date = new Date(now);
            date.setDate(date.getDate() - d);
            const ds = date.toISOString().split("T")[0];
            vals.push(h.completedDates.includes(ds) ? 1 : 0);
          }
          this.ctx.font = "500 8px Inter, system-ui, sans-serif";
          this.ctx.fillStyle = C.text;
          this.ctx.fillText(`${h.icon} ${h.title}`, this.M + 8, this.y + 10);
          this.drawSparkline(vals, this.M + 160, this.y, this.CW - 170, 14, C.sage);
          this.y += 22;
        }
      });
    }
  }

  private buildAnxietyChart(data: ExportData) {
    if (data.anxietyEntries.length < 2) return;
    this.sp(8);
    this.subtitle("Аналитика тревоги");

    const sorted = [...data.anxietyEntries].sort((a, b) => a.date.localeCompare(b.date));
    const points = sorted.map(e => ({
      label: formatDateShort(e.date),
      value: e.level,
    }));

    this.card(() => {
      this.drawLineChart(points, 110, C.terracotta, "Уровень тревоги", "1–10", 0, 10.5);
    });

    // Average
    const avg = sorted.reduce((s, e) => s + e.level, 0) / sorted.length;
    this.text(`Средний уровень: ${avg.toFixed(1)}/10`, { color: C.textMuted, size: 10, indent: 8 });

    // Trigger analysis
    const triggers: Record<string, number> = {};
    sorted.forEach(e => { if (e.trigger) triggers[e.trigger] = (triggers[e.trigger] || 0) + 1; });
    const topTriggers = Object.entries(triggers).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (topTriggers.length > 0) {
      this.sp(4);
      this.card(() => {
        this.drawBarChart(
          topTriggers.map(([t, c]) => ({ label: t.slice(0, 25), value: c, color: C.lavender })),
          "Частые триггеры",
        );
      });
    }
  }

  private buildSleepChart(data: ExportData) {
    if (!data.sleepEntries || data.sleepEntries.length < 2) return;
    this.sp(8);
    this.subtitle("Аналитика сна");

    const sorted = [...data.sleepEntries].sort((a, b) => a.date.localeCompare(b.date));

    // Hours chart
    this.card(() => {
      this.drawLineChart(
        sorted.map(e => ({ label: formatDateShort(e.date), value: e.hours })),
        100, C.dustyBlue, "Продолжительность сна", "часы", 0, 12,
      );
    });

    // Quality chart
    if (sorted.some(e => e.quality > 0)) {
      this.card(() => {
        this.drawLineChart(
          sorted.map(e => ({ label: formatDateShort(e.date), value: e.quality })),
          80, C.lavender, "Качество сна", "1–5", 0.5, 5.5,
        );
      });
    }

    const avgH = sorted.reduce((s, e) => s + e.hours, 0) / sorted.length;
    const avgQ = sorted.reduce((s, e) => s + e.quality, 0) / sorted.length;
    this.text(`Среднее: ${avgH.toFixed(1)} ч · Качество: ${avgQ.toFixed(1)}/5`, { color: C.textMuted, size: 10, indent: 8 });
  }

  private buildTasks(data: ExportData) {
    if (data.tasks.length === 0) return;
    this.sp(8);
    this.subtitle("Задачи");
    const done = data.tasks.filter(t => t.completed);
    const pend = data.tasks.filter(t => !t.completed);

    this.text(`Всего: ${data.tasks.length} · Выполнено: ${done.length} · В процессе: ${pend.length}`, { color: C.textMuted, size: 10 });
    this.sp(4);

    // Completion donut
    if (data.tasks.length >= 3) {
      this.card(() => {
        this.drawDonutChart([
          { label: "Выполнено", value: done.length, color: C.sage },
          { label: "В процессе", value: pend.length, color: C.gold },
        ], "Прогресс задач", 80);
      });
    }

    // Category breakdown
    const catCounts: Record<string, { done: number; total: number }> = {};
    data.tasks.forEach(t => {
      if (!catCounts[t.category]) catCounts[t.category] = { done: 0, total: 0 };
      catCounts[t.category].total++;
      if (t.completed) catCounts[t.category].done++;
    });
    const catBars = Object.entries(catCounts).map(([cat, { done: d, total }]) => ({
      label: catLabels[cat] || cat,
      value: d,
      color: C.teal,
    }));
    if (catBars.length > 1) {
      this.card(() => {
        this.drawBarChart(catBars, "Выполнено по категориям");
      });
    }

    // Recent tasks list
    this.sp(4);
    const recent = [...data.tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15);
    for (const task of recent) {
      this.card(() => {
        const check = task.completed ? "✓" : "○";
        const color = task.completed ? C.sage : C.textMuted;
        this.ctx.font = "500 11px Inter, system-ui, sans-serif";
        this.ctx.fillStyle = color;
        this.ctx.fillText(check, this.M + 8, this.y + 12);
        this.ctx.fillStyle = task.completed ? C.textMuted : C.text;
        this.ctx.fillText(task.title, this.M + 24, this.y + 12);
        this.y += 18;
        const meta = [catLabels[task.category] || task.category, priLabels[task.priority] || task.priority, formatDateFull(task.createdAt)].join(" · ");
        this.ctx.font = "400 8px Inter, system-ui, sans-serif";
        this.ctx.fillStyle = C.textFaint;
        this.ctx.fillText(meta, this.M + 24, this.y + 4);
        this.y += 8;
      });
    }
    if (data.tasks.length > 15) {
      this.text(`…и ещё ${data.tasks.length - 15} задач`, { color: C.textFaint, size: 9, indent: 8 });
    }
  }

  private buildHabits(data: ExportData) {
    if (data.habits.length === 0) return;
    this.sp(8);
    this.subtitle("Привычки");
    for (const h of data.habits) {
      this.card(() => {
        this.ctx.font = "500 11px Inter, system-ui, sans-serif";
        this.ctx.fillStyle = C.text;
        this.ctx.fillText(`${h.icon}  ${h.title}`, this.M + 8, this.y + 12);
        this.y += 20;
        this.kv("Текущая серия", `${h.streak} дн.`, 8);
        this.kv("Лучшая серия", `${h.bestStreak} дн.`, 8);
        this.kv("Выполнений (за период)", `${h.completedDates.length}`, 8);
        this.kv("Категория", catLabels[h.category] || h.category, 8);
      });
    }
  }

  private buildMoods(data: ExportData) {
    if (data.moods.length === 0) return;
    this.sp(8);
    this.subtitle("Записи настроения");
    const recent = [...data.moods].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
    for (const entry of recent) {
      this.ensure(40);
      this.ctx.font = "400 9px Inter, system-ui, sans-serif";
      this.ctx.fillStyle = C.textFaint;
      this.ctx.fillText(formatDateFull(entry.date), this.M + 8, this.y + 10);
      this.ctx.font = "500 10px Inter, system-ui, sans-serif";
      this.ctx.fillStyle = C.text;
      this.ctx.fillText(moodLabels[entry.mood] || entry.mood, this.M + 100, this.y + 10);
      this.ctx.fillStyle = C.textMuted;
      this.ctx.fillText(`Энергия: ${entry.energy}/5`, this.M + 220, this.y + 10);
      this.y += 14;
      if (entry.note) this.text(entry.note, { size: 9, color: C.textMuted, indent: 8 });
      this.sp(2);
    }
    if (data.moods.length > 15) {
      this.text(`…и ещё ${data.moods.length - 15} записей`, { color: C.textFaint, size: 9, indent: 8 });
    }
  }

  private buildJournal(data: ExportData) {
    if (data.journalEntries.length === 0) return;
    this.sp(8);
    this.subtitle("Дневник");
    this.text(`Записей: ${data.journalEntries.length}`, { color: C.textMuted, size: 10 });
    this.sp(4);
    const recent = [...data.journalEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    for (const entry of recent) {
      this.card(() => {
        this.ctx.font = "500 9px Inter, system-ui, sans-serif";
        this.ctx.fillStyle = C.textFaint;
        this.ctx.fillText(formatDateFull(entry.date), this.M + 8, this.y + 10);
        if (entry.mood) this.ctx.fillText(`· ${entry.mood}`, this.M + 120, this.y + 10);
        this.y += 16;
        const txt = entry.text.length > 300 ? entry.text.slice(0, 300) + "…" : entry.text;
        this.text(txt, { size: 10, indent: 8 });
      });
    }
    if (data.journalEntries.length > 10) {
      this.text(`…и ещё ${data.journalEntries.length - 10} записей`, { color: C.textFaint, size: 9, indent: 8 });
    }
  }

  private buildAnxiety(data: ExportData) {
    if (data.anxietyEntries.length === 0) return;
    this.sp(8);
    this.subtitle("Записи тревоги");
    const recent = [...data.anxietyEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    for (const entry of recent) {
      this.card(() => {
        this.ctx.font = "500 9px Inter, system-ui, sans-serif";
        this.ctx.fillStyle = C.textFaint;
        this.ctx.fillText(formatDateFull(entry.date), this.M + 8, this.y + 10);
        this.ctx.fillStyle = entry.level >= 7 ? C.terracotta : entry.level >= 4 ? C.gold : C.sage;
        this.ctx.fillText(`Уровень: ${entry.level}/10`, this.M + 120, this.y + 10);
        this.y += 16;
        if (entry.trigger) this.kv("Триггер", entry.trigger, 8);
        if (entry.notes) this.text(entry.notes, { size: 9, color: C.textMuted, indent: 8 });
      });
    }
  }

  private buildWorries(data: ExportData) {
    if (data.worryEntries.length === 0) return;
    this.sp(8);
    this.subtitle("Дневник беспокойств");
    const reviewed = data.worryEntries.filter(w => w.reviewed);
    const happened = reviewed.filter(w => w.happened);
    this.text(`Всего: ${data.worryEntries.length} · Проверено: ${reviewed.length} · Сбылось: ${happened.length}`, { color: C.textMuted, size: 10 });
    if (reviewed.length > 0) {
      const pct = Math.round((happened.length / reviewed.length) * 100);
      this.text(`Из проверенных опасений сбылось только ${pct}% — большинство ваших страхов не оправдываются.`, { size: 10, color: C.sage, indent: 8 });

      // Worry outcome donut
      this.sp(4);
      this.card(() => {
        this.drawDonutChart([
          { label: "Не сбылось", value: reviewed.length - happened.length, color: C.sage },
          { label: "Сбылось", value: happened.length, color: C.terracotta },
        ], "Исход опасений", 70);
      });
    }
  }

  private buildPomodoro(data: ExportData) {
    if (!data.pomodoroStats || data.pomodoroStats.totalSessions === 0) return;
    this.sp(8);
    this.subtitle("Помодоро");
    this.card(() => {
      this.kv("Сессий", `${data.pomodoroStats.totalSessions}`, 8);
      this.kv("Минут фокуса", `${data.pomodoroStats.totalMinutes}`, 8);
      this.kv("Дней подряд", `${data.pomodoroStats.streakDays}`, 8);
      const hours = Math.floor(data.pomodoroStats.totalMinutes / 60);
      if (hours > 0) this.kv("Часов фокуса", `${hours} ч ${data.pomodoroStats.totalMinutes % 60} мин`, 8);
    });
  }

  private buildAchievements(data: ExportData) {
    if (data.softAchievements.length === 0) return;
    this.sp(8);
    this.subtitle("Достижения заботы");
    const unlocked = data.softAchievements.filter(a => a.unlocked);
    this.text(`Открыто: ${unlocked.length}/${data.softAchievements.length}`, { color: C.textMuted, size: 10 });
    this.sp(4);

    const catL: Record<string, string> = { care: "Забота", growth: "Рост", courage: "Смелость", connection: "Связь", awareness: "Осознанность" };
    const catC: Record<string, string> = { care: C.lavender, growth: C.sage, courage: C.terracotta, connection: C.dustyBlue, awareness: C.lavender };

    // Achievement category donut
    const catCounts: Record<string, number> = {};
    unlocked.forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });
    if (Object.keys(catCounts).length > 1) {
      this.card(() => {
        this.drawDonutChart(
          Object.entries(catCounts).map(([cat, count]) => ({
            label: catL[cat] || cat, value: count, color: catC[cat] || C.textFaint,
          })),
          "Достижения по категориям", 70,
        );
      });
    }

    for (const ach of unlocked) {
      this.ensure(28);
      this.ctx.font = "500 10px Inter, system-ui, sans-serif";
      this.ctx.fillStyle = C.text;
      this.ctx.fillText(`${ach.icon}  ${ach.title}`, this.M + 8, this.y + 10);
      this.ctx.font = "400 8px Inter, system-ui, sans-serif";
      this.ctx.fillStyle = catC[ach.category] || C.textFaint;
      this.ctx.fillText(catL[ach.category] || ach.category, this.M + 320, this.y + 10);
      if (ach.unlockedAt) {
        this.ctx.fillStyle = C.textFaint;
        this.ctx.fillText(formatDateFull(ach.unlockedAt), this.M + 420, this.y + 10);
      }
      this.y += 16;
      this.text(ach.description, { size: 9, color: C.textMuted, indent: 20 });
      this.sp(4);
    }

    const locked = data.softAchievements.filter(a => !a.unlocked);
    if (locked.length > 0) {
      this.sp(4);
      this.text(`Ещё не открыто: ${locked.map(a => a.title).join(", ")}`, { size: 9, color: C.textFaint, indent: 8 });
    }
  }

  private buildFooter() {
    this.sp(20);
    this.divider();
    this.sp(6);
    this.ctx.font = "italic 10px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.sage;
    this.ctx.textAlign = "center";
    this.ctx.fillText("Каждый шаг на пути заботы о себе — это уже достижение", this.W / 2, this.y + 10);
    this.ctx.textAlign = "left";
    this.y += 20;
    this.ctx.font = "400 8px Inter, system-ui, sans-serif";
    this.ctx.fillStyle = C.textFaint;
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Сгенерировано ${new Date().toLocaleString("ru-RU")} · Routine App`, this.W / 2, this.y + 8);
    this.ctx.textAlign = "left";
  }

  // ─── Main build ───
  build(data: ExportData): jsPDF {
    this.buildCover(data);

    // Charts section (analytics)
    this.buildMoodCharts(data);
    this.buildHabitCharts(data);
    this.buildAnxietyChart(data);
    this.buildSleepChart(data);

    // Data sections
    this.buildTasks(data);
    this.buildHabits(data);
    this.buildMoods(data);
    this.buildJournal(data);
    this.buildAnxiety(data);
    this.buildWorries(data);
    this.buildPomodoro(data);
    this.buildAchievements(data);
    this.buildFooter();

    this.flushPage();
    return this.pdf;
  }
}

// ─── Public API ───

export function generatePDFReport(data: ExportData, period: PdfPeriod = "all"): void {
  try {
    const filtered = filterData(data, period);
    const renderer = new PDFRenderer(period);
    const pdf = renderer.build(filtered);
    const today = new Date().toISOString().split("T")[0];
    pdf.save(`routine-отчёт-${today}.pdf`);
  } catch (err) {
    console.error("PDF export error:", err);
    throw err;
  }
}
