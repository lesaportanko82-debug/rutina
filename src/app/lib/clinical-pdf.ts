import jsPDF from "jspdf";
import type { MoodEntry, AnxietyEntry, JournalEntry, SleepEntry } from "../components/use-app-store";

/**
 * Выгрузка для специалиста: настроение, тревога, сон и дневник за период.
 * Строгий документ без игровых элементов — то, что удобно принести на приём.
 * Текст рисуется на canvas (кириллица), страницы кладутся в PDF картинками.
 */

export interface ClinicalExportInput {
  name: string;
  days: number;
  moods: MoodEntry[];
  anxiety: AnxietyEntry[];
  sleep: SleepEntry[];
  journal: JournalEntry[];
  include: { mood: boolean; anxiety: boolean; sleep: boolean; journal: boolean };
}

const W = 1240, H = 1754, M = 96; // A4 при 150 dpi
const INK = "#2B2925", MUTED = "#7A746B", LINE = "#DDD6CB", ACCENT = "#5B8A64";
const FONT = "'Manrope', 'Segoe UI', Arial, sans-serif";

const fmt = (d: string) => {
  try { return new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
};
const fmtShort = (d: string) => {
  try { return new Date(d + "T12:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }); }
  catch { return d; }
};

class Doc {
  pages: HTMLCanvasElement[] = [];
  ctx!: CanvasRenderingContext2D;
  y = M;

  constructor() { this.newPage(); }

  newPage() {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "top";
    this.pages.push(c);
    this.ctx = ctx;
    this.y = M;
  }

  need(h: number) { if (this.y + h > H - M) this.newPage(); }

  wrap(text: string, font: string, maxW: number): string[] {
    this.ctx.font = font;
    const out: string[] = [];
    for (const para of text.split(/\n/)) {
      let line = "";
      for (const word of para.split(/\s+/)) {
        const probe = line ? line + " " + word : word;
        if (this.ctx.measureText(probe).width > maxW && line) { out.push(line); line = word; }
        else line = probe;
      }
      out.push(line);
    }
    return out;
  }

  text(text: string, opts: { size?: number; weight?: number; color?: string; x?: number; maxW?: number; gap?: number } = {}) {
    const { size = 22, weight = 400, color = INK, x = M, maxW = W - M - x, gap = 8 } = opts;
    const font = `${weight} ${size}px ${FONT}`;
    const lh = Math.round(size * 1.45);
    for (const line of this.wrap(text, font, maxW)) {
      this.need(lh);
      this.ctx.font = font;
      this.ctx.fillStyle = color;
      this.ctx.fillText(line, x, this.y);
      this.y += lh;
    }
    this.y += gap;
  }

  heading(text: string) {
    this.need(120);
    this.y += 22;
    this.text(text, { size: 30, weight: 700, gap: 6 });
    this.rule(ACCENT, 3, 90);
    this.y += 16;
  }

  rule(color = LINE, width = 1, length = W - 2 * M) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(M, this.y, length, width);
    this.y += width + 10;
  }

  /** Строка таблицы: колонки с переносом, высота по самой длинной */
  row(cells: { text: string; x: number; w: number; weight?: number; color?: string }[], size = 20) {
    const lh = Math.round(size * 1.45);
    const wrapped = cells.map((c) => this.wrap(c.text || "—", `${c.weight ?? 400} ${size}px ${FONT}`, c.w));
    const h = Math.max(...wrapped.map((w) => w.length)) * lh + 14;
    this.need(h);
    cells.forEach((c, i) => {
      this.ctx.font = `${c.weight ?? 400} ${size}px ${FONT}`;
      this.ctx.fillStyle = c.color ?? INK;
      wrapped[i].forEach((line, j) => this.ctx.fillText(line, c.x, this.y + j * lh));
    });
    this.y += h - 8;
    this.ctx.fillStyle = LINE;
    this.ctx.fillRect(M, this.y, W - 2 * M, 1);
    this.y += 9;
  }
}

export async function generateClinicalPdf(input: ClinicalExportInput): Promise<void> {
  try { await document.fonts.ready; } catch { /* ignore */ }

  const since = new Date();
  since.setDate(since.getDate() - input.days);
  const sinceKey = since.toISOString().split("T")[0];
  const inPeriod = <T extends { date: string }>(xs: T[]) =>
    xs.filter((x) => x.date >= sinceKey).sort((a, b) => a.date.localeCompare(b.date));

  const moods = inPeriod(input.moods);
  const anxiety = inPeriod(input.anxiety);
  const sleep = inPeriod(input.sleep);
  const journal = inPeriod(input.journal);

  const doc = new Doc();

  // Шапка
  doc.text("Записи самонаблюдения", { size: 40, weight: 700, gap: 4 });
  doc.text(`${input.name ? input.name + " · " : ""}${fmt(sinceKey)} — ${fmt(new Date().toISOString().split("T")[0])}`, { size: 22, color: MUTED, gap: 14 });
  doc.rule();
  doc.text(
    "Документ составлен из записей, которые человек сам вёл в приложении «Рутина». Это самонаблюдение, а не результат обследования и не диагноз.",
    { size: 19, color: MUTED, gap: 6 }
  );

  // Настроение
  if (input.include.mood) {
    doc.heading("Настроение");
    if (moods.length === 0) doc.text("За период записей нет.", { color: MUTED });
    else {
      const counts = new Map<string, number>();
      for (const m of moods) counts.set(m.mood, (counts.get(m.mood) ?? 0) + 1);
      const summary = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k.toLowerCase()} — ${v}`).join(", ");
      const avgEnergy = moods.reduce((s, m) => s + m.energy, 0) / moods.length;
      doc.text(`Записей: ${moods.length}. По дням: ${summary}.`, { gap: 2 });
      doc.text(`Средняя энергия: ${avgEnergy.toFixed(1)} из 5.`, { gap: 14 });
      doc.row([
        { text: "Дата", x: M, w: 110, weight: 700, color: MUTED },
        { text: "Настроение", x: M + 130, w: 220, weight: 700, color: MUTED },
        { text: "Энергия", x: M + 370, w: 110, weight: 700, color: MUTED },
        { text: "Заметка", x: M + 500, w: W - 2 * M - 500, weight: 700, color: MUTED },
      ], 18);
      for (const m of moods) {
        doc.row([
          { text: fmtShort(m.date), x: M, w: 110 },
          { text: m.mood, x: M + 130, w: 220 },
          { text: `${m.energy}/5`, x: M + 370, w: 110 },
          { text: m.note ?? "", x: M + 500, w: W - 2 * M - 500 },
        ]);
      }
    }
  }

  // Тревога
  if (input.include.anxiety) {
    doc.heading("Тревога");
    if (anxiety.length === 0) doc.text("За период записей нет.", { color: MUTED });
    else {
      const avgLevel = anxiety.reduce((s, a) => s + a.level, 0) / anxiety.length;
      const maxLevel = Math.max(...anxiety.map((a) => a.level));
      doc.text(`Эпизодов записано: ${anxiety.length}. Средний уровень: ${avgLevel.toFixed(1)} из 10, максимальный: ${maxLevel}.`, { gap: 14 });
      doc.row([
        { text: "Дата", x: M, w: 150, weight: 700, color: MUTED },
        { text: "Уровень", x: M + 170, w: 110, weight: 700, color: MUTED },
        { text: "Триггер", x: M + 300, w: 260, weight: 700, color: MUTED },
        { text: "Заметки и что помогло", x: M + 580, w: W - 2 * M - 580, weight: 700, color: MUTED },
      ], 18);
      for (const a of anxiety) {
        const used = [a.usedBreathing && "дыхание", a.usedGrounding && "заземление"].filter(Boolean).join(", ");
        const notes = [a.notes, used && `Использовано: ${used}`].filter(Boolean).join(". ");
        doc.row([
          { text: `${fmtShort(a.date)} ${a.time ?? ""}`.trim(), x: M, w: 150 },
          { text: `${a.level}/10`, x: M + 170, w: 110 },
          { text: a.trigger, x: M + 300, w: 260 },
          { text: notes, x: M + 580, w: W - 2 * M - 580 },
        ]);
      }
    }
  }

  // Сон
  if (input.include.sleep) {
    doc.heading("Сон");
    if (sleep.length === 0) doc.text("За период записей нет.", { color: MUTED });
    else {
      const avgH = sleep.reduce((s, x) => s + x.hours, 0) / sleep.length;
      const avgQ = sleep.reduce((s, x) => s + x.quality, 0) / sleep.length;
      doc.text(`Ночей записано: ${sleep.length}. В среднем ${avgH.toFixed(1)} ч, качество ${avgQ.toFixed(1)} из 5.`, { gap: 14 });
      for (const x of sleep) {
        doc.row([
          { text: fmtShort(x.date), x: M, w: 110 },
          { text: `${x.hours} ч`, x: M + 130, w: 100 },
          { text: `качество ${x.quality}/5`, x: M + 250, w: 200 },
          { text: [x.factors?.join(", "), x.note].filter(Boolean).join(". "), x: M + 470, w: W - 2 * M - 470 },
        ]);
      }
    }
  }

  // Дневник
  if (input.include.journal) {
    doc.heading("Дневник");
    if (journal.length === 0) doc.text("За период записей нет.", { color: MUTED });
    for (const j of journal) {
      doc.need(90);
      doc.text(fmt(j.date) + (j.mood ? ` · ${j.mood.toLowerCase()}` : ""), { size: 19, weight: 700, color: MUTED, gap: 2 });
      doc.text(j.text, { size: 21, gap: 18 });
    }
  }

  // Сборка PDF с номерами страниц
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  doc.pages.forEach((c, i) => {
    const ctx = c.getContext("2d")!;
    ctx.font = `400 16px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`Рутина · стр. ${i + 1} из ${doc.pages.length}`, M, H - 48);
    if (i > 0) pdf.addPage();
    pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw, ph);
  });
  pdf.save(`rutina-zapisi-${new Date().toISOString().split("T")[0]}.pdf`);
}
