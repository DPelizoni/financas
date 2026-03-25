export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "financas-theme";
export const DEFAULT_THEME_MODE: ThemeMode = "light";

interface ThemeColorStatus {
  surface: string;
  text: string;
  border: string;
}

export interface AppThemeTokens {
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  background: {
    canvas: string;
    surface: string;
    elevated: string;
    muted: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
  };
  brand: {
    primary: string;
    primaryHover: string;
    secondary: string;
    focusRing: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  status: {
    success: ThemeColorStatus;
    warning: ThemeColorStatus;
    error: ThemeColorStatus;
    info: ThemeColorStatus;
  };
  action: {
    hover: string;
    selected: string;
    focus: string;
    disabledBg: string;
    disabledText: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
  chart: {
    receita: string;
    despesa: string;
    saldo: string;
    pendente: string;
    pago: string;
    pie: [string, string, string, string, string];
  };
}

export const appThemeTokens: Record<ThemeMode, AppThemeTokens> = {
  light: {
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    background: {
      canvas: "#f8fafc",
      surface: "#ffffff",
      elevated: "#ffffff",
      muted: "#f1f5f9",
      overlay: "rgba(2, 6, 23, 0.5)",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      muted: "#64748b",
      inverse: "#f8fafc",
    },
    border: {
      subtle: "#e2e8f0",
      default: "#cbd5e1",
      strong: "#94a3b8",
    },
    brand: {
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      secondary: "#0ea5e9",
      focusRing: "#38bdf8",
    },
    semantic: {
      success: "#16a34a",
      warning: "#d97706",
      error: "#dc2626",
      info: "#0284c7",
    },
    status: {
      success: {
        surface: "#dcfce7",
        text: "#166534",
        border: "#86efac",
      },
      warning: {
        surface: "#fef3c7",
        text: "#92400e",
        border: "#fcd34d",
      },
      error: {
        surface: "#fee2e2",
        text: "#991b1b",
        border: "#fca5a5",
      },
      info: {
        surface: "#e0f2fe",
        text: "#075985",
        border: "#7dd3fc",
      },
    },
    action: {
      hover: "rgba(15, 23, 42, 0.04)",
      selected: "rgba(37, 99, 235, 0.14)",
      focus: "rgba(37, 99, 235, 0.18)",
      disabledBg: "#f1f5f9",
      disabledText: "#94a3b8",
    },
    shadow: {
      sm: "0 1px 2px rgba(15, 23, 42, 0.08)",
      md: "0 8px 20px rgba(15, 23, 42, 0.08)",
      lg: "0 24px 48px rgba(15, 23, 42, 0.12)",
    },
    chart: {
      receita: "#10b981",
      despesa: "#ef4444",
      saldo: "#0ea5e9",
      pendente: "#f59e0b",
      pago: "#22c55e",
      pie: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"],
    },
  },
  dark: {
    neutral: {
      50: "#0f172a",
      100: "#1e293b",
      200: "#334155",
      300: "#475569",
      400: "#64748b",
      500: "#94a3b8",
      600: "#cbd5e1",
      700: "#e2e8f0",
      800: "#f1f5f9",
      900: "#f8fafc",
    },
    background: {
      canvas: "#020617",
      surface: "#0f172a",
      elevated: "#111c31",
      muted: "#1e293b",
      overlay: "rgba(2, 6, 23, 0.72)",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#cbd5e1",
      muted: "#94a3b8",
      inverse: "#020617",
    },
    border: {
      subtle: "#1e293b",
      default: "#334155",
      strong: "#475569",
    },
    brand: {
      primary: "#3b82f6",
      primaryHover: "#60a5fa",
      secondary: "#38bdf8",
      focusRing: "#38bdf8",
    },
    semantic: {
      success: "#4ade80",
      warning: "#fbbf24",
      error: "#f87171",
      info: "#38bdf8",
    },
    status: {
      success: {
        surface: "#052e16",
        text: "#86efac",
        border: "#166534",
      },
      warning: {
        surface: "#422006",
        text: "#fcd34d",
        border: "#92400e",
      },
      error: {
        surface: "#450a0a",
        text: "#fca5a5",
        border: "#991b1b",
      },
      info: {
        surface: "#082f49",
        text: "#7dd3fc",
        border: "#0369a1",
      },
    },
    action: {
      hover: "rgba(148, 163, 184, 0.12)",
      selected: "rgba(37, 99, 235, 0.28)",
      focus: "rgba(56, 189, 248, 0.24)",
      disabledBg: "#1e293b",
      disabledText: "#64748b",
    },
    shadow: {
      sm: "0 1px 2px rgba(2, 6, 23, 0.4)",
      md: "0 10px 24px rgba(2, 6, 23, 0.44)",
      lg: "0 24px 56px rgba(2, 6, 23, 0.55)",
    },
    chart: {
      receita: "#34d399",
      despesa: "#fb7185",
      saldo: "#38bdf8",
      pendente: "#fbbf24",
      pago: "#22c55e",
      pie: ["#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"],
    },
  },
};

export const isThemeMode = (value: string | null | undefined): value is ThemeMode =>
  value === "light" || value === "dark";

export const resolveThemeMode = (storedValue: string | null, prefersDark: boolean): ThemeMode => {
  if (isThemeMode(storedValue)) {
    return storedValue;
  }

  return prefersDark ? "dark" : DEFAULT_THEME_MODE;
};
