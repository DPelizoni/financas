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
            MuiButton: {
              defaultProps: {
                disableElevation: true,
              },
              styleOverrides: {
                root: {
                  borderRadius: 6,
                },
              },
            },
            MuiOutlinedInput: {
              styleOverrides: {
                root: {
                  borderRadius: 6,
                },
              },
            },
            MuiPaper: {
              styleOverrides: {
                rounded: {
                  borderRadius: 8,
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
