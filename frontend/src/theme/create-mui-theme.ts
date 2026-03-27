import { alpha, createTheme } from "@mui/material/styles";
import { ptBR } from "@mui/material/locale";
import { appThemeTokens, ThemeMode } from "@/theme/theme-tokens";

export const createMuiTheme = (mode: ThemeMode) => {
  const tokens = appThemeTokens[mode];
  const inputSurfaceColor = alpha(tokens.background.surface, mode === "dark" ? 0.92 : 1);
  const autofillSurfaceColor =
    mode === "dark" ? inputSurfaceColor : alpha(tokens.brand.secondary, 0.14);

  return createTheme(
    {
      palette: {
        mode,
        primary: {
          main: tokens.brand.primary,
          dark: tokens.brand.primaryHover,
        },
        secondary: {
          main: tokens.brand.secondary,
        },
        success: {
          main: tokens.semantic.success,
        },
        warning: {
          main: tokens.semantic.warning,
        },
        error: {
          main: tokens.semantic.error,
        },
        info: {
          main: tokens.semantic.info,
        },
        text: {
          primary: tokens.text.primary,
          secondary: tokens.text.secondary,
        },
        divider: tokens.border.default,
        action: {
          hover: tokens.action.hover,
          selected: tokens.action.selected,
          focus: tokens.action.focus,
          disabledBackground: tokens.action.disabledBg,
          disabled: tokens.action.disabledText,
        },
        background: {
          default: tokens.background.canvas,
          paper: tokens.background.surface,
        },
      },
      shape: {
        borderRadius: 8,
      },
      typography: {
        fontFamily: "var(--font-app), Inter, sans-serif",
        button: {
          fontWeight: 600,
          textTransform: "none",
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            "::selection": {
              backgroundColor: alpha(tokens.brand.primary, 0.3),
            },
          },
        },
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              borderRadius: 8,
              fontWeight: 600,
              "&:focus-visible": {
                outline: `2px solid ${tokens.brand.focusRing}`,
                outlineOffset: 2,
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              "&:focus-visible": {
                outline: `2px solid ${tokens.brand.focusRing}`,
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
              borderRadius: 8,
              backgroundColor: inputSurfaceColor,
              transition: "background-color 0.2s ease, border-color 0.2s ease",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: tokens.border.default,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: tokens.border.strong,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: tokens.brand.secondary,
                borderWidth: "1px",
              },
            },
            input: {
              "&::placeholder": {
                color: tokens.text.muted,
                opacity: 1,
              },
              "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                WebkitTextFillColor: tokens.text.primary,
                caretColor: tokens.text.primary,
                WebkitBoxShadow: `0 0 0 100px ${autofillSurfaceColor} inset`,
                borderRadius: "inherit",
                transition: "background-color 9999s ease-out 0s",
              },
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              color: tokens.text.muted,
            },
            shrink: {
              color: tokens.text.secondary,
            },
          },
        },
        MuiFormHelperText: {
          styleOverrides: {
            root: {
              color: tokens.text.muted,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            rounded: {
              borderRadius: 10,
            },
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            icon: {
              color: tokens.text.muted,
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
  );
};
