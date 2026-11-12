import { useEffect, useState } from "react";
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

type Surfaces = Pick<Theme, "bg" | "bgSecondary" | "bgTertiary" | "card" | "border" | "borderLight" | "navBg" | "inputBg">;

const lightPhases: Record<DayPhase, Surfaces> = {
  // тёплый кремовый, золотистый
  morning: {
    bg: "#FCF8F0", bgSecondary: "#F7EFE1", bgTertiary: "#F3EBDE", card: "#FEFBF5",
    border: "#EBE2D2", borderLight: "#E8DFCE", navBg: "rgba(252, 248, 240, 0.95)", inputBg: "#FEFBF5",
  },
  // светлый нейтральный — базовая палитра
  day: {
    bg: "#FAF8F5", bgSecondary: "#F5F0E8", bgTertiary: "#F0EDE8", card: "#FDFCFA",
    border: "#E8E3DC", borderLight: "#E5E0D8", navBg: "rgba(250, 248, 245, 0.95)", inputBg: "#FDFCFA",
  },
  // приглушённый тёплый
  evening: {
    bg: "#F6F0E8", bgSecondary: "#EFE6D9", bgTertiary: "#EAE1D5", card: "#FAF5EE",
    border: "#E2D8C9", borderLight: "#DED4C4", navBg: "rgba(246, 240, 232, 0.95)", inputBg: "#FAF5EE",
  },
  // глубокий тёплый серый, ещё спокойнее
  night: {
    bg: "#F1ECE5", bgSecondary: "#E9E2D8", bgTertiary: "#E4DCD2", card: "#F6F2EC",
    border: "#DCD3C6", borderLight: "#D7CEC1", navBg: "rgba(241, 236, 229, 0.95)", inputBg: "#F6F2EC",
  },
};

const darkPhases: Record<DayPhase, Surfaces> = {
  morning: {
    bg: "#1B1917", bgSecondary: "#272320", bgTertiary: "#332E29", card: "#272320",
    border: "#3D3832", borderLight: "#3D3832", navBg: "rgba(27, 25, 23, 0.95)", inputBg: "#332E29",
  },
  day: {
    bg: "#1A1918", bgSecondary: "#242220", bgTertiary: "#302D2A", card: "#242220",
    border: "#3A3734", borderLight: "#3A3734", navBg: "rgba(26, 25, 24, 0.95)", inputBg: "#302D2A",
  },
  evening: {
    bg: "#1C1917", bgSecondary: "#28231F", bgTertiary: "#342E28", card: "#28231F",
    border: "#3E3831", borderLight: "#3E3831", navBg: "rgba(28, 25, 23, 0.95)", inputBg: "#342E28",
  },
  night: {
    bg: "#161513", bgSecondary: "#201E1B", bgTertiary: "#2B2824", card: "#201E1B",
    border: "#34302B", borderLight: "#34302B", navBg: "rgba(22, 21, 19, 0.95)", inputBg: "#2B2824",
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
  return { ...base, ...surfaces };
}

export function getThemeColors(dark: boolean): Theme {
  return dark ? darkTheme : lightTheme;
}
