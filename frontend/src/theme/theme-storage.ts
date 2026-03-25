import {
  DEFAULT_THEME_MODE,
  isThemeMode,
  resolveThemeMode,
  THEME_STORAGE_KEY,
  ThemeMode,
} from "@/theme/theme-tokens";

export const getSystemThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_MODE;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const getStoredThemeMode = (): ThemeMode | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(value) ? value : null;
};

export const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_MODE;
  }

  return resolveThemeMode(
    window.localStorage.getItem(THEME_STORAGE_KEY),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
};

export const applyThemeModeToDocument = (mode: ThemeMode): void => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
};

export const persistThemeMode = (mode: ThemeMode): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
};
