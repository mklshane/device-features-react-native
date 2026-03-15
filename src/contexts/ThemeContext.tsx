import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeMode, ThemeColors, themeColors } from "../styles/colors";

interface ThemeContextProps {
  theme: ThemeMode;
  isDarkMode: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: "light",
  isDarkMode: false,
  colors: themeColors.light,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [hydrated, setHydrated] = useState(false);

  // Load the last selected theme from local storage on mount.
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("theme-mode");
        if (stored === "dark" || stored === "light") {
          setTheme(stored);
        }
      } finally {
        setHydrated(true);
      }
    };
    load();
  }, []);

  // Toggle between light and dark theme modes.
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Persist the selected theme after hydration completes.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem("theme-mode", theme).catch(() => {});
  }, [theme, hydrated]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      colors: themeColors[theme],
      toggleTheme,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
