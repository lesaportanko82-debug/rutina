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

export function useTheme(): Theme {
  const { darkMode } = useApp();
  return darkMode ? darkTheme : lightTheme;
}

export function getThemeColors(dark: boolean): Theme {
  return dark ? darkTheme : lightTheme;
}
