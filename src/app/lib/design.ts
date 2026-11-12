/**
 * Токены оформления.
 *
 * Три решения, на которых всё держится:
 * 1. Контраст размеров. Текст приложения жил в диапазоне 0.72–1.4rem — это
 *    читается как шаблон. Шкала ниже разнесена намеренно: одно крупное число
 *    на экран против очень тихой мелочи.
 * 2. Неровный воздух. Внутри группы тесно, между разделами просторно.
 *    Равномерные 16px везде — главный признак вёрстки без ритма.
 * 3. Цвет как событие. Единственный насыщенный элемент экрана — заливка
 *    полосы дня. Всё остальное, включая иконки привычек, рисуется тушью.
 */

export const type = {
  /** Одно главное число экрана */
  hero: "2.6rem",
  /** Приветствие, крупный заголовок */
  title: "1.9rem",
  /** Заголовок экрана */
  heading: "1.35rem",
  /** Заголовок раздела */
  section: "1rem",
  body: "0.95rem",
  small: "0.82rem",
  micro: "0.72rem",
} as const;

/** Шаг воздуха: тесно внутри группы, просторно между разделами */
export const space = {
  hair: 4,
  tight: 8,
  inner: 14,
  group: 24,
  section: 40,
} as const;

export const motion = {
  /** Нажатия и раскрытия: пружина с весом, вещи оседают, а не щёлкают */
  press: { type: "spring", stiffness: 240, damping: 26, mass: 0.9 },
  settle: { type: "spring", stiffness: 160, damping: 24, mass: 1.1 },
  /** Фоновое, несрочное */
  ambient: { duration: 0.9, ease: [0.22, 0.61, 0.36, 1] },
} as const;

/** Единственный насыщенный цвет приложения */
export const ACCENT = "#5B8A64";

/* ── Правило: декоративный оттенок опознаёт, но не несёт текст ──────────
   Любой цвет категории/настроения/уровня, попадающий в color:, проходит
   через inkFor() — он сохраняет оттенок и затемняет светлоту до AA
   на самой светлой поверхности приложения. */

/* Худший случай для тёмного текста — самая тёмная поверхность приложения
   (ночная страница под полупрозрачной плашкой). Решаем против неё. */
const DARKEST = "#D3C9BF";

function srgb(c: number) { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }
function luminance(hex: string) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
export function contrastRatio(a: string, b: string) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function toHsl(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  let hue = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    hue = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hue *= 60;
  }
  return { h: hue, s, l };
}
function fromHsl(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6];
  return "#" + seg.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

const inkCache = new Map<string, string>();

/** Делает оттенок пригодным для текста, сохраняя его узнаваемость. */
/* Опорный фон, против которого решается читаемость. Тема выставляет его
   при смене режима; направление (темнее или светлее) выбирается само. */
let INK_REF = DARKEST;
export function setInkReference(bg: string) {
  if (bg && bg !== INK_REF) { INK_REF = bg; inkCache.clear(); }
}

export function inkFor(hex: string, min = 4.7, against = INK_REF) {
  const key = hex + min + against;
  const hit = inkCache.get(key);
  if (hit) return hit;
  const { h, s } = toHsl(hex);
  const sat = Math.min(s * 1.12, 0.78);
  const onDark = luminance(against) < 0.25;
  let out = onDark ? "#FFFFFF" : "#000000";
  if (onDark) {
    // светлый фон текста на тёмной подложке: самый тёмный проходящий тон
    for (let l = 35; l <= 96; l += 1) {
      const cand = fromHsl(h, sat, l / 100);
      if (contrastRatio(cand, against) >= min) { out = cand; break; }
    }
  } else {
    for (let l = 55; l >= 6; l -= 1) {
      const cand = fromHsl(h, sat, l / 100);
      if (contrastRatio(cand, against) >= min) { out = cand; break; }
    }
  }
  inkCache.set(key, out);
  return out;
}
