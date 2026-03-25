/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        app: {
          canvas: "rgb(var(--app-bg-canvas) / <alpha-value>)",
          surface: "rgb(var(--app-bg-surface) / <alpha-value>)",
          elevated: "rgb(var(--app-bg-elevated) / <alpha-value>)",
          muted: "rgb(var(--app-bg-muted) / <alpha-value>)",
          text: {
            primary: "rgb(var(--app-text-primary) / <alpha-value>)",
            secondary: "rgb(var(--app-text-secondary) / <alpha-value>)",
            muted: "rgb(var(--app-text-muted) / <alpha-value>)",
            inverse: "rgb(var(--app-text-inverse) / <alpha-value>)",
          },
          border: {
            subtle: "rgb(var(--app-border-subtle) / <alpha-value>)",
            DEFAULT: "rgb(var(--app-border-default) / <alpha-value>)",
            strong: "rgb(var(--app-border-strong) / <alpha-value>)",
          },
          brand: {
            primary: "rgb(var(--app-brand-primary) / <alpha-value>)",
            secondary: "rgb(var(--app-brand-secondary) / <alpha-value>)",
          },
        },
        neutral: {
          50: "rgb(var(--app-neutral-50) / <alpha-value>)",
          100: "rgb(var(--app-neutral-100) / <alpha-value>)",
          200: "rgb(var(--app-neutral-200) / <alpha-value>)",
          300: "rgb(var(--app-neutral-300) / <alpha-value>)",
          400: "rgb(var(--app-neutral-400) / <alpha-value>)",
          500: "rgb(var(--app-neutral-500) / <alpha-value>)",
          600: "rgb(var(--app-neutral-600) / <alpha-value>)",
          700: "rgb(var(--app-neutral-700) / <alpha-value>)",
          800: "rgb(var(--app-neutral-800) / <alpha-value>)",
          900: "rgb(var(--app-neutral-900) / <alpha-value>)",
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      boxShadow: {
        appSm: "var(--app-shadow-sm)",
        appMd: "var(--app-shadow-md)",
        appLg: "var(--app-shadow-lg)",
      },
    },
  },
  plugins: [],
}
