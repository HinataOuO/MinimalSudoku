import { useGameStore } from "@/store/gameStore";
import { defaultThemeMode, type ThemeMode } from "@/theme/types";

export const themes = {
  dark: {
    canvas: "#0A0A0A",
    panel: "#111111",
    panelElevated: "#151515",
    ink: "#F2F2F2",
    muted: "#8A8A8A",
    line: "#222222",
    strongLine: "#464646",
    accent: "#FFB547",
    accentInk: "#14100A",
    accentSoft: "#261D0F",
    danger: "#D66A6A",
    dangerSoft: "#241313",
    fixedCell: "#111111",
    emptyCell: "#0D0D0D",
    selectedCell: "#3A2911",
    relatedCell: "#21180C",
    matchingValueCell: "#2D200E"
  },
  light: {
    canvas: "#F7F3EA",
    panel: "#FFFCF6",
    panelElevated: "#F1E9DD",
    ink: "#181713",
    muted: "#6F695F",
    line: "#DDD3C4",
    strongLine: "#9B846B",
    accent: "#2F6FDB",
    accentInk: "#F7FBFF",
    accentSoft: "#DDEBFF",
    danger: "#B84B4B",
    dangerSoft: "#F7DDDD",
    fixedCell: "#FFF9F0",
    emptyCell: "#F8F1E7",
    selectedCell: "#CFE1FF",
    relatedCell: "#E5F0FF",
    matchingValueCell: "#D8E8FF"
  }
} as const;

export type ThemeColors = (typeof themes)[ThemeMode];

export const colors = themes.dark;

export function useThemeColors() {
  const themeMode = useGameStore((state) => state.themeMode);

  return themes[themeMode] ?? themes[defaultThemeMode];
}
