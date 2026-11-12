/**
 * Рукотворные элементы: след руки вместо геометрии.
 * Сдержанно — только галочка и фактура бумаги, иначе превращается в скевоморфизм.
 */

/** Галочка, нарисованная пером: неровная, с переменной толщиной линии. */
export function InkCheck({ size = 14, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 13.2c1.6 1.1 3.3 2.9 4.6 4.7 1.4-3.6 5-8.9 10.2-12.4"
        stroke={color}
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Подчёркивание от руки — для акцентов в заголовках. */
export function InkUnderline({ width = 120, color = "#5B8A64" }: { width?: number; color?: string }) {
  return (
    <svg width={width} height="7" viewBox="0 0 120 7" fill="none" preserveAspectRatio="none" aria-hidden>
      <path d="M2 4.6C22 2.3 46 1.6 70 2.4c16 .5 34 1.8 48 2.9" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** Разделитель с лёгкой неровностью вместо линейки в 1 пиксель. */
export function InkDivider({ color = "#D8D1C6" }: { color?: string }) {
  return (
    <svg width="100%" height="5" viewBox="0 0 300 5" fill="none" preserveAspectRatio="none" aria-hidden>
      <path d="M1 3.1C48 1.9 96 1.6 150 2.2c42 .5 84 1.2 149 1.6" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Лица настроения, нарисованные пером ───
// Вместо системных эмодзи: одна рука, одна толщина линии, один характер.

type FaceKind = "joy" | "calm" | "energy" | "thoughtful" | "sad" | "anxious" | "tired" | "irritated" | "neutral";

const FACE_BY_MOOD: Record<string, FaceKind> = {
  "Радость": "joy",
  "Спокойствие": "calm",
  "Энергия": "energy",
  "Задумчивость": "thoughtful",
  "Грусть": "sad",
  "Тревога": "anxious",
  "Усталость": "tired",
  "Раздражение": "irritated",
};

const PILL_EYES = ["M11.6 12.6v1.5", "M20.4 12.6v1.5"];

/** Линии лица без контура головы */
const FACE_PATHS: Record<FaceKind, { thin: string[]; eyes?: string[] }> = {
  joy: {
    thin: ["M9.5 14.2c1-1.7 3.1-1.7 4.1 0", "M18.4 14.2c1-1.7 3.1-1.7 4.1 0", "M10.4 18.7c1.7 3.4 9.6 3.5 11.3 0"],
  },
  calm: {
    thin: ["M9.5 13.2c1 1.4 3.1 1.4 4.1 0", "M18.4 13.2c1 1.4 3.1 1.4 4.1 0", "M12.2 19.6c1.5 1.3 6.2 1.4 7.7 0"],
  },
  energy: {
    eyes: PILL_EYES,
    thin: ["M10.6 18.3c3.5.5 7.2.5 10.8-.1-.5 3.3-2.6 5-5.3 5-2.8 0-5-1.6-5.5-4.9z"],
  },
  thoughtful: {
    eyes: ["M12.4 12.4v1.5", "M21.2 12.4v1.5"],
    thin: ["M18.6 9.3c1.3-.9 3-.9 4.3.1", "M12.8 20.3c1.9-.5 3.9-.4 5.9.4"],
  },
  sad: {
    eyes: PILL_EYES,
    thin: ["M9 11l3.7-1.4", "M23 11l-3.7-1.4", "M11.6 21.6c1.6-2.7 7.3-2.7 8.9 0"],
  },
  anxious: {
    thin: [
      "M9 10.6l3.6-1.5", "M23 10.6l-3.6-1.5",
      "M11.6 12.2a1.5 1.6 0 1 0 .1 0z", "M20.4 12.2a1.5 1.6 0 1 0 .1 0z",
      "M10.6 20.8c1.2-1.5 2.4 1.4 3.6 0s2.4-1.5 3.6 0 2.4 1.4 3.6-.1",
    ],
  },
  tired: {
    thin: ["M9.5 13.6c1.3.5 2.8.5 4.1 0", "M18.4 13.6c1.3.5 2.8.5 4.1 0", "M13.8 20.6c.9-1.2 3.5-1.2 4.4 0", "M9.8 16.4c.9.5 2.4.5 3.3 0", "M18.9 16.4c.9.5 2.4.5 3.3 0"],
  },
  irritated: {
    eyes: ["M11.6 13.2v1.4", "M20.4 13.2v1.4"],
    thin: ["M8.9 9.6l4 1.8", "M23.1 9.6l-4 1.8", "M11.8 20.9c2.7-.6 5.6-.6 8.4 0"],
  },
  neutral: {
    eyes: PILL_EYES,
    thin: ["M11.8 20.2c2.8.3 5.6.3 8.4 0"],
  },
};

export function InkFace({
  mood,
  size = 26,
  color = "#4A4540",
  tint,
}: {
  /** Название настроения по-русски или вид лица напрямую */
  mood: string;
  size?: number;
  color?: string;
  /** Цвет лёгкой заливки головы — обычно цвет настроения */
  tint?: string;
}) {
  const kind: FaceKind = FACE_BY_MOOD[mood] ?? ((mood in FACE_PATHS ? mood : "neutral") as FaceKind);
  const face = FACE_PATHS[kind];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path
        d="M16.2 3.5c7-.3 12.5 5.2 12.4 12.3-.1 7.1-5.7 12.7-12.7 12.6C8.9 28.3 3.4 22.8 3.5 15.8 3.6 9 9.1 3.8 16.2 3.5z"
        fill={tint ?? "none"}
        fillOpacity={tint ? 0.28 : 0}
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {face.eyes?.map((d) => (
        <path key={d} d={d} stroke={color} strokeWidth="2.3" strokeLinecap="round" />
      ))}
      {face.thin.map((d) => (
        <path key={d} d={d} stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

/** Шкала из пяти лиц: от тяжёлого к хорошему (сон, оценки) */
export const FACE_SCALE: FaceKind[] = ["sad", "tired", "neutral", "calm", "joy"];
