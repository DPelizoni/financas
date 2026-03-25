"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { useMemo } from "react";
import { ThemeModeProvider, useThemeMode } from "@/theme/theme-context";
import { createMuiTheme } from "@/theme/create-mui-theme";

interface MuiAppProviderProps {
  children: React.ReactNode;
}

function MuiThemeBridge({ children }: MuiAppProviderProps) {
  const { mode } = useThemeMode();

  const theme = useMemo(() => createMuiTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function MuiAppProvider({ children }: MuiAppProviderProps) {
  return (
    <ThemeModeProvider>
      <MuiThemeBridge>{children}</MuiThemeBridge>
    </ThemeModeProvider>
  );
}
