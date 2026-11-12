import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";

/**
 * Листик — герой приложения, нарисованный тушью.
 *
 * Правила, которым он подчиняется:
 * — он ничего не требует. Не грустит от пропусков, не просит вернуться,
 *   не зависит от поведения пользователя. Мы убрали растение, которое надо
 *   было поливать, и возвращать вину нельзя.
 * — движение редкое и медленное: одно на экран, цикл 7–9 секунд.
 * — в дыхательной практике он работает как метроном: с ним дышат.
 *
 * Линия строится двумя проходами, как настоящая тушь: контур плюс «нажим»
 * на теневой стороне. Жилка разорвана в зоне лица, чтобы не резать мимику.
 */

export type LeafMood = "morning" | "day" | "evening" | "night" | "near";
export type BreathPhase = "inhale" | "hold" | "exhale" | "rest";

const STEM = "M50 106 C48 112 45 117 41 121";
const STEM_LOW = "M50 106 C47 112 43 116 39 119";

type Body = {
  blade: string;
  weight: string;
  midribLow: string;
  midribHigh: string;
  stem: string;
  veins: string[];
};

/** Утро: лист тянется вверх, уже и выше */
const MORNING: Body = {
  blade: "M50 106 C30 95 19 75 20 54 C21 33 40 14 60 11 C76 26 86 47 84 66 C82 85 68 98 50 106 Z",
  weight: "M50 106 C33 96 21 78 20 58",
  midribLow: "M50 106 C52 93 53 85 54 78",
  midribHigh: "M57 45 C58 33 59 22 60 12",
  stem: STEM,
  veins: ["M53 88 C45 85 37 83 31 82", "M54 86 C62 83 69 81 75 80", "M52 97 C46 95 41 93 36 92"],
};

/** День: шире и устойчивее */
const DAY: Body = {
  blade: "M50 106 C27 96 13 76 15 55 C17 34 37 15 60 13 C79 28 91 49 89 67 C87 87 70 99 50 106 Z",
  weight: "M50 106 C31 97 17 79 15 59",
  midribLow: "M50 106 C52 93 53 85 54 78",
  midribHigh: "M57 45 C58 34 59 24 60 14",
  stem: STEM,
  veins: [
    "M53 88 C44 85 35 83 28 82",
    "M54 86 C63 83 71 81 78 80",
    "M52 97 C45 95 39 93 34 92",
    "M52 96 C59 94 65 92 71 91",
  ],
};

/** Вечер и ночь: остриё притуплено, лист клонится. Усталость несёт лицо, не силуэт. */
const SOFT: Body = {
  blade: "M50 106 C27 96 13 76 15 55 C17 36 35 19 56 17 C74 24 89 48 87 67 C85 87 70 99 50 106 Z",
  weight: "M50 106 C31 97 17 79 15 59",
  midribLow: "M50 106 C52 93 53 85 54 78",
  midribHigh: "M56 46 C57 36 56 27 55 20",
  stem: STEM_LOW,
  veins: ["M53 88 C44 85 35 83 28 82", "M54 86 C63 83 71 81 78 80", "M52 97 C45 95 39 93 34 92"],
};

type Face = { eyes: string[]; lines: string[] };

const FACES: Record<LeafMood | "breathe", Face> = {
  morning: { eyes: ["M43 54 v6", "M63 52 v6"], lines: ["M47 70 C53 76 61 75 66 69"] },
  day: { eyes: [], lines: ["M39 56 C43 60 48 60 52 56", "M58 54 C62 58 67 58 71 54", "M48 70 C53 75 61 74 65 68"] },
  evening: { eyes: ["M43 55 v5", "M63 53 v5"], lines: ["M49 70 C53 74 60 74 64 70"] },
  night: { eyes: [], lines: ["M39 58 C43 63 48 63 52 58", "M58 56 C62 61 67 61 71 56", "M50 71 C53 74 59 73 62 70"] },
  near: { eyes: ["M43 55 v5", "M63 53 v5"], lines: ["M48 71 C53 74 60 74 65 70"] },
  breathe: { eyes: [], lines: ["M39 57 C43 61 48 61 52 57", "M58 55 C62 59 67 59 71 55", "M48 70 C53 75 61 74 65 68"] },
};

const DEW = "M73 36 C76 41 78 45 78 48 C78 52 76 54 73 54 C70 54 68 52 68 48 C68 45 70 41 73 36 Z";

const BODY: Record<LeafMood, Body> = { morning: MORNING, day: DAY, evening: SOFT, night: SOFT, near: DAY };
const TINT: Record<LeafMood, string> = {
  morning: "#E9DFC4",
  day: "#CFE0CB",
  evening: "#E4D5C0",
  night: "#D5D1CB",
  near: "#DCD2DF",
};
const TILT: Record<LeafMood, number> = { morning: -4, day: 4, evening: 13, night: 18, near: -2 };

/** Покачивание — одно медленное движение, разное по настроению */
const SWAY: Record<LeafMood, { rotate: number[]; duration: number }> = {
  morning: { rotate: [-4, -1, -4], duration: 7 },
  day: { rotate: [4, 7, 4], duration: 8 },
  evening: { rotate: [13, 15, 13], duration: 9 },
  night: { rotate: [18, 19, 18], duration: 11 },
  near: { rotate: [-2, 0, -2], duration: 7 },
};

/**
 * Насколько лист вытягивается на вдохе и оседает на выдохе.
 * Амплитуда заметная намеренно: по листу дышат, значит движение должно
 * читаться боковым зрением, без вглядывания.
 */
const BREATH: Record<BreathPhase, { scaleX: number; scaleY: number; rotate: number }> = {
  inhale: { scaleX: 1.02, scaleY: 1.2, rotate: 0 },
  hold: { scaleX: 1.02, scaleY: 1.2, rotate: 0 },
  exhale: { scaleX: 0.92, scaleY: 0.82, rotate: 4 },
  rest: { scaleX: 1, scaleY: 1, rotate: 2 },
};

export function InkLeaf({
  mood = "day",
  size = 104,
  breath,
  /** Длительность текущей фазы дыхания в секундах — лист должен идти в такт счёту */
  breathDuration = 4,
  /** Рисовать линию при появлении. По умолчанию да — один раз за монтирование. */
  draw = true,
  className,
}: {
  mood?: LeafMood;
  size?: number;
  breath?: BreathPhase;
  breathDuration?: number;
  draw?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const body = BODY[mood];
  const face = breath ? FACES.breathe : FACES[mood];
  const ink = "#3A3632";

  // Порядок прорисовки — как если бы рисовали от руки: черешок, контур,
  // нажим, жилка, боковые жилки, лицо.
  const order = useMemo(() => {
    let i = 0;
    const next = () => (draw && !reduce ? 0.07 * i++ : 0);
    return {
      stem: next(),
      blade: next(),
      weight: next(),
      midribLow: next(),
      midribHigh: next(),
      veins: body.veins.map(() => next()),
      face: next(),
    };
  }, [body, draw, reduce]);

  const line = (d: string, width: number, delay: number, opacity = 1) => (
    <motion.path
      key={d}
      d={d}
      fill="none"
      stroke={ink}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      initial={draw && !reduce ? { pathLength: 0 } : false}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    />
  );

  const sway = SWAY[mood];
  const breathState = breath ? BREATH[breath] : null;

  // Движение живёт на обёртке, а не на самом <svg>: css-трансформации на
  // svg-элементе ведут себя непредсказуемо между браузерами.
  // Точка вращения — основание листа (50,106 из 104×128), а не центр рамки.
  return (
    <motion.div
      className={className}
      style={{ width: size, height: size * 1.23, transformOrigin: "48% 83%", flexShrink: 0 }}
      animate={
        reduce
          ? { rotate: TILT[mood], scaleX: 1, scaleY: 1 }
          : breathState
            ? { rotate: breathState.rotate, scaleX: breathState.scaleX, scaleY: breathState.scaleY }
            : { rotate: sway.rotate, scaleX: 1, scaleY: 1 }
      }
      transition={
        reduce
          ? { duration: 0 }
          : breathState
            ? { duration: breath === "hold" ? 0.3 : breathDuration, ease: "easeInOut" }
            : { duration: sway.duration, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <svg viewBox="0 0 104 128" width={size} height={size * 1.23} aria-hidden style={{ overflow: "visible", display: "block" }}>
        <motion.path
          d={body.blade}
          fill={TINT[mood]}
          fillOpacity={0.5}
          initial={draw && !reduce ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: draw && !reduce ? 0.35 : 0 }}
        />
        {body.veins.map((v, i) => line(v, 1.2, order.veins[i], 0.5))}
        {line(body.blade, 2.3, order.blade)}
        {line(body.weight, 4.2, order.weight)}
        {line(body.midribLow, 2.1, order.midribLow)}
        {line(body.midribHigh, 2.1, order.midribHigh)}
        {line(body.stem, 2.4, order.stem)}
        {face.eyes.map((e) => line(e, 3, order.face))}
        {face.lines.map((l) => line(l, 2, order.face))}
        {mood === "morning" && (
          <motion.path
            d={DEW}
            fill="#A8C8CC"
            fillOpacity={0.5}
            stroke={ink}
            strokeWidth={1.4}
            initial={draw && !reduce ? { opacity: 0, y: -3 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: draw && !reduce ? 0.75 : 0 }}
          />
        )}
      </svg>
    </motion.div>
  );
}

/** Какое настроение у Листика сейчас — по часам */
export function leafMoodForHour(hour: number): LeafMood {
  if (hour < 5) return "night";
  if (hour < 11) return "morning";
  if (hour < 17) return "day";
  if (hour < 22) return "evening";
  return "night";
}
