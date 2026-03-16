"use client";

import {
  CssBaseline,
  PaletteMode,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { ptBR } from "@mui/material/locale";
import { useEffect, useMemo, useState } from "react";

interface MuiAppProviderProps {
  children: React.ReactNode;
}

const detectMode = (): PaletteMode => {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export default function MuiAppProvider({ children }: MuiAppProviderProps) {
  const [mode, setMode] = useState<PaletteMode>("light");

  useEffect(() => {
    const syncMode = () => setMode(detectMode());

    syncMode();

    const observer = new MutationObserver(syncMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const theme = useMemo(
    () =>
      createTheme(
        {
          palette: {
            mode,
            primary: { main: "#2563eb" },
            secondary: { main: "#0ea5e9" },
            text:
              mode === "dark"
                ? { primary: "#e2e8f0", secondary: "#94a3b8" }
                : { primary: "#0f172a", secondary: "#475569" },
            divider: mode === "dark" ? "#334155" : "#cbd5e1",
            action: {
              hover:
                mode === "dark"
                  ? "rgba(148, 163, 184, 0.12)"
                  : "rgba(15, 23, 42, 0.04)",
              selected:
                mode === "dark"
                  ? "rgba(37, 99, 235, 0.28)"
                  : "rgba(37, 99, 235, 0.14)",
              focus:
                mode === "dark"
                  ? "rgba(59, 130, 246, 0.28)"
                  : "rgba(37, 99, 235, 0.18)",
            },
            background:
              mode === "dark"
                ? { default: "#020617", paper: "#0f172a" }
                : { default: "#f8fafc", paper: "#ffffff" },
          },
          shape: {
            borderRadius: 6,
          },
          typography: {
            fontFamily: "var(--font-app), Inter, sans-serif",
            button: {
              textTransform: "none",
              fontWeight: 600,
            },
          },
          components: {
            MuiCssBaseline: {
              styleOverrides: {
                "::selection": {
                  backgroundColor: "rgba(37, 99, 235, 0.3)",
                },
              },
            },
            MuiButton: {
              defaultProps: {
                disableElevation: true,
              },
              styleOverrides: {
                root: {
                  borderRadius: 6,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:focus-visible": {
                    outline: "2px solid #38bdf8",
                    outlineOffset: 2,
                  },
                },
              },
            },
            MuiIconButton: {
              styleOverrides: {
                root: {
                  borderRadius: 6,
                  "&:focus-visible": {
                    outline: "2px solid #38bdf8",
                    outlineOffset: 2,
                  },
                },
              },
            },
            MuiTextField: {
              defaultProps: {
                variant: "outlined",
                size: "small",
              },
            },
            MuiOutlinedInput: {
              styleOverrides: {
                root: {
                  borderRadius: 6,
                  backgroundColor:
                    mode === "dark" ? "rgba(15, 23, 42, 0.92)" : "#ffffff",
                  transition: "background-color 0.2s ease, border-color 0.2s ease",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: mode === "dark" ? "#334155" : "#cbd5e1",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: mode === "dark" ? "#475569" : "#94a3b8",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#38bdf8",
                    borderWidth: "1px",
                  },
                },
                input: {
                  "&::placeholder": {
                    color: mode === "dark" ? "#94a3b8" : "#64748b",
                    opacity: 1,
                  },
                },
              },
            },
            MuiInputLabel: {
              styleOverrides: {
                root: {
                  color: mode === "dark" ? "#94a3b8" : "#64748b",
                },
                shrink: {
                  color: mode === "dark" ? "#cbd5e1" : "#475569",
                },
              },
            },
            MuiFormHelperText: {
              styleOverrides: {
                root: {
                  color: mode === "dark" ? "#94a3b8" : "#64748b",
                },
              },
            },
            MuiPaper: {
              styleOverrides: {
                rounded: {
                  borderRadius: 8,
                },
                root: {
                  backgroundImage: "none",
                },
              },
            },
            MuiMenuItem: {
              styleOverrides: {
                root: {
                  fontSize: "0.875rem",
                },
              },
            },
            MuiSelect: {
              styleOverrides: {
                icon: {
                  color: mode === "dark" ? "#94a3b8" : "#64748b",
                },
              },
            },
            MuiTableCell: {
              styleOverrides: {
                head: {
                  fontWeight: 600,
                },
              },
            },
          },
        },
        ptBR,
      ),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
