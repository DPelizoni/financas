import { THEME_STORAGE_KEY } from "@/theme/theme-tokens";

export const themeInitScript = `
(() => {
  try {
    const storageKey = "${THEME_STORAGE_KEY}";
    const storedTheme = localStorage.getItem(storageKey);
    const resolvedTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  } catch {
    // Prevent hydration issues when storage access is blocked.
  }
})();
`;
