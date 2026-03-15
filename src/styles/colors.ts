export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
}

export const themeColors: Record<ThemeMode, ThemeColors> = {
  light: {
    background: "#F7F9FC",
    surface: "#FFFFFF",
    text: "#111827",
    textSecondary: "#4B5563",
    primary: "#0A84FF",
    border: "#E5E7EB",
  },
  dark: {
    background: "#0B1220",
    surface: "#111827",
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    primary: "#60A5FA",
    border: "#1F2937",
  },
};
