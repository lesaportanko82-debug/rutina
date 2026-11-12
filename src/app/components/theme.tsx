import { useEffect, useState } from "react";
import { setInkReference } from "../lib/design";
import { useApp } from "./app-context";

export interface Theme {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  card: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  navBg: string;
  navBorder: string;
  overlay: string;
  inputBg: string;
  // Accents stay the same
  sage: string;
  lavender: string;
  terracotta: string;
  dustyBlue: string;
  gold: string;
  teal: string;
  rose: string;
  warm: string;
  /** Цвет рисунка — тёмный на бумаге, светлый в тёмной теме. */
  ink: string;
  onInk: string;
  /** Погружающая панель (дыхание) — тёмная в обоих режимах. */
  field: string;
  onField: string;
  accent: string;
  attention: string;
  /** Контур элемента управления — единственный его признак, потому ≥3:1. */
  control: string;
}

const lightTheme: Theme = {
  bg: "#FAF8F5",
  bgSecondary: "#F5F0E8",
  bgTertiary: "#F0EDE8",
  card: "#FAF8F5",
  border: "#E8E3DC",
  borderLight: "#E5E0D8",
  text: "#4A4540",
  textSecondary: "#6B665F",
  textMuted: "#9B9489",
  textFaint: "#B5AFA6",
  navBg: "rgba(250, 248, 245, 0.95)",
  navBorder: "#E8E3DC",
  overlay: "rgba(0,0,0,0.3)",
  inputBg: "#FAF8F5",
  sage: "#8DB596",
  lavender: "#9B8EC4",
  terracotta: "#C4876C",
  dustyBlue: "#7EA8BE",
  gold: "#C4A86C",
  teal: "#7BAFB0",
  rose: "#B88FA7",
  warm: "#A3907A",
  ink: "#20261F",
  onInk: "#EDE7DB",
  field: "#20261F",
  onField: "#EDE7DB",
  accent: "#437253",
  attention: "#94593C",
  control: "#7F7360",
};

const darkTheme: Theme = {
  bg: "#1A1918",
  bgSecondary: "#242220",
  bgTertiary: "#302D2A",
  card: "#242220",
  border: "#3A3734",
  borderLight: "#3A3734",
  text: "#E5E0D8",
  textSecondary: "#B5AFA6",
  textMuted: "#8A847B",
  textFaint: "#6B665F",
  navBg: "rgba(26, 25, 24, 0.95)",
  navBorder: "#3A3734",
  overlay: "rgba(0,0,0,0.5)",
  inputBg: "#302D2A",
  sage: "#8DB596",
  lavender: "#9B8EC4",
  terracotta: "#C4876C",
  dustyBlue: "#7EA8BE",
  gold: "#C4A86C",
  teal: "#7BAFB0",
  rose: "#B88FA7",
  warm: "#A3907A",
  ink: "#F6F5F3",
  onInk: "#12150F",
  field: "#12150F",
  onField: "#E5E0D8",
  accent: "#8CC6A3",
  attention: "#D99A72",
  control: "#A9A296",
};

// ─── Температура интерфейса по времени суток ───
// Сдвигаются только поверхности: текст и акценты не трогаем,
// чтобы контраст и узнаваемость оставались постоянными.

export type DayPhase = "morning" | "day" | "evening" | "night";

export const phaseLabel: Record<DayPhase, string> = {
  morning: "Утро",
  day: "День",
  evening: "Вечер",
  night: "Ночь",
};

export function phaseAt(hour: number): DayPhase {
  if (hour < 5) return "night";
  if (hour < 11) return "morning";
  if (hour < 17) return "day";
  if (hour < 22) return "evening";
  return "night";
}

type Surfaces = Pick<Theme,
  | "bg" | "bgSecondary" | "bgTertiary" | "card" | "border" | "borderLight" | "navBg" | "inputBg"
  | "text" | "textSecondary" | "textMuted" | "textFaint" | "accent" | "attention">;

const lightPhases: Record<DayPhase, Surfaces> = {
  morning: {
    bg: "#E6E0D7", bgSecondary: "#EDE9E2", bgTertiary: "#E6E0D7", card: "#F4F2EE",
    border: "#D3C7B3", borderLight: "#D9CFBF", navBg: "rgba(230, 224, 215, 0.96)", inputBg: "#E6E0D7",
    text: "#403A32", textSecondary: "#554E45", textMuted: "#615B51", textFaint: "#635D55",
    accent: "#3C664A", attention: "#845036",
  },
  day: {
    bg: "#EDE9E2", bgSecondary: "#F4F2EE", bgTertiary: "#EDE9E2", card: "#FBFAF9",
    border: "#D9CFBF", borderLight: "#DFD8CB", navBg: "rgba(237, 233, 226, 0.96)", inputBg: "#EDE9E2",
    text: "#453F37", textSecondary: "#5A534A", textMuted: "#665F55", textFaint: "#696259",
    accent: "#3F6B4E", attention: "#8B5439",
  },
  evening: {
    bg: "#DFD8CB", bgSecondary: "#E6E0D7", bgTertiary: "#DFD8CB", card: "#EDE9E2",
    border: "#CDBFA6", borderLight: "#D3C7B3", navBg: "rgba(223, 216, 203, 0.96)", inputBg: "#DFD8CB",
    text: "#3B352E", textSecondary: "#504A42", textMuted: "#5C564D", textFaint: "#5E5950",
    accent: "#396046", attention: "#7D4C33",
  },
  night: {
    bg: "#D9CFBF", bgSecondary: "#DFD8CB", bgTertiary: "#D9CFBF", card: "#E6E0D7",
    border: "#C7B69A", borderLight: "#CDBFA6", navBg: "rgba(217, 207, 191, 0.96)", inputBg: "#D9CFBF",
    text: "#35302A", textSecondary: "#4B453E", textMuted: "#575149", textFaint: "#59544C",
    accent: "#365B42", attention: "#764730",
  },
};

const darkPhases: Record<DayPhase, Surfaces> = {
  morning: {
    bg: "#22201C", bgSecondary: "#302D29", bgTertiary: "#3E3A36", card: "#302D29",
    border: "#44413C", borderLight: "#3E3A36", navBg: "rgba(34, 32, 28, 0.95)", inputBg: "#3E3A36",
    text: "#F6F5F3", textSecondary: "#E0DCD7", textMuted: "#CFCBC3", textFaint: "#CDC9C2",
    accent: "#AAD5B9", attention: "#E6C5AF",
  },
  day: {
    bg: "#292623", bgSecondary: "#37342F", bgTertiary: "#44413C", card: "#37342F",
    border: "#4B4843", borderLight: "#44413C", navBg: "rgba(41, 38, 35, 0.95)", inputBg: "#44413C",
    text: "#F6F5F3", textSecondary: "#E0DCD7", textMuted: "#CFCBC3", textFaint: "#CDC9C2",
    accent: "#AAD5B9", attention: "#E6C5AF",
  },
  evening: {
    bg: "#22201C", bgSecondary: "#302D29", bgTertiary: "#3E3A36", card: "#302D29",
    border: "#44413C", borderLight: "#3E3A36", navBg: "rgba(34, 32, 28, 0.95)", inputBg: "#3E3A36",
    text: "#F6F5F3", textSecondary: "#E0DCD7", textMuted: "#CFCBC3", textFaint: "#CDC9C2",
    accent: "#AAD5B9", attention: "#E6C5AF",
  },
  night: {
    bg: "#141210", bgSecondary: "#22201C", bgTertiary: "#302D29", card: "#22201C",
    border: "#37342F", borderLight: "#302D29", navBg: "rgba(20, 18, 16, 0.95)", inputBg: "#302D29",
    text: "#F6F5F3", textSecondary: "#E0DCD7", textMuted: "#CFCBC3", textFaint: "#CDC9C2",
    accent: "#AAD5B9", attention: "#E6C5AF",
  },
};

/** Текущая часть суток; обновляется сама, когда время переходит границу. */
export function useDayPhase(): DayPhase {
  const [phase, setPhase] = useState<DayPhase>(() => phaseAt(new Date().getHours()));
  useEffect(() => {
    const tick = () => setPhase(phaseAt(new Date().getHours()));
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return phase;
}

export function useTheme(): Theme {
  const { darkMode, dayTinting } = useApp();
  const phase = useDayPhase();
  const base = darkMode ? darkTheme : lightTheme;
  if (dayTinting === false) return base;
  const surfaces = (darkMode ? darkPhases : lightPhases)[phase];
  // Самая «опасная» поверхность режима — против неё решается читаемость оттенков.
  setInkReference(darkMode ? "#56534F" : "#D3C9BF");
  return { ...base, ...surfaces };
}

export function getThemeColors(dark: boolean): Theme {
  return dark ? darkTheme : lightTheme;
}
