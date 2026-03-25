"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/theme/theme-context";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { isDarkMode, toggleMode } = useThemeMode();

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
      className={`app-control-button inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold ${className}`.trim()}
    >
      {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
      <span className="hidden sm:inline">{isDarkMode ? "Claro" : "Escuro"}</span>
    </button>
  );
}
