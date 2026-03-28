import { ReactNode } from "react";

type TransactionSectionTone = "blue" | "red" | "gray";

interface TransactionSectionProps {
  title: string;
  tone: TransactionSectionTone;
  children: ReactNode;
}

interface TransactionSectionLabelProps {
  tone: TransactionSectionTone;
  children: ReactNode;
  htmlFor?: string;
}

const toneStyles: Record<
  TransactionSectionTone,
  {
    container: string;
    title: string;
    label: string;
    input: string;
    secondaryButton: string;
    shortcutButton: string;
    primaryButton: string;
    primaryCompactButton: string;
    chip: string;
    emptyState: string;
  }
> = {
  blue: {
    container:
      "border-[rgb(var(--app-status-info-border))] bg-[rgb(var(--app-status-info-bg))]",
    title: "text-[rgb(var(--app-status-info-text))]",
    label: "text-[rgb(var(--app-status-info-text))]",
    input:
      "border-[rgb(var(--app-status-info-border))] focus:border-[rgb(var(--app-brand-secondary))]",
    secondaryButton:
      "border-[rgb(var(--app-status-info-border))] bg-[rgb(var(--app-bg-surface))] text-[rgb(var(--app-status-info-text))] hover:bg-[rgb(var(--app-status-info-bg))]",
    shortcutButton:
      "border-[rgb(var(--app-status-info-border))] bg-[rgb(var(--app-bg-surface))] text-[rgb(var(--app-status-info-text))] hover:bg-[rgb(var(--app-status-info-bg))]",
    primaryButton: "app-button-primary",
    primaryCompactButton: "app-button-primary",
    chip:
      "border-[rgb(var(--app-status-info-border))] bg-[rgb(var(--app-bg-surface))] text-[rgb(var(--app-status-info-text))] hover:bg-[rgb(var(--app-status-info-bg))]",
    emptyState: "text-[rgb(var(--app-status-info-text))]",
  },
  red: {
    container:
      "border-[rgb(var(--app-status-error-border))] bg-[rgb(var(--app-status-error-bg))]",
    title: "text-[rgb(var(--app-status-error-text))]",
    label: "text-[rgb(var(--app-status-error-text))]",
    input:
      "border-[rgb(var(--app-status-error-border))] focus:border-[rgb(var(--app-semantic-error))]",
    secondaryButton:
      "border-[rgb(var(--app-status-error-border))] bg-[rgb(var(--app-bg-surface))] text-[rgb(var(--app-status-error-text))] hover:bg-[rgb(var(--app-status-error-bg))]",
    shortcutButton:
      "border-[rgb(var(--app-status-error-border))] bg-[rgb(var(--app-bg-surface))] text-[rgb(var(--app-status-error-text))] hover:bg-[rgb(var(--app-status-error-bg))]",
    primaryButton: "app-button-danger",
    primaryCompactButton: "app-button-danger",
    chip:
      "border-[rgb(var(--app-status-error-border))] bg-[rgb(var(--app-bg-surface))] text-[rgb(var(--app-status-error-text))] hover:bg-[rgb(var(--app-status-error-bg))]",
    emptyState: "text-[rgb(var(--app-status-error-text))]",
  },
  gray: {
    container: "",
    title: "text-[rgb(var(--app-text-primary))]",
    label: "text-[rgb(var(--app-text-primary))]",
    input:
      "border-[rgb(var(--app-border-default))] focus:border-[rgb(var(--app-brand-secondary))]",
    secondaryButton:
      "border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))] text-[rgb(var(--app-text-secondary))] hover:bg-[rgb(var(--app-bg-muted))]",
    shortcutButton:
      "border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))] text-[rgb(var(--app-text-secondary))] hover:bg-[rgb(var(--app-bg-muted))]",
    primaryButton: "app-button-neutral",
    primaryCompactButton: "app-button-neutral",
    chip:
      "border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))] text-[rgb(var(--app-text-secondary))] hover:bg-[rgb(var(--app-bg-muted))]",
    emptyState: "text-[rgb(var(--app-text-secondary))]",
  },
};

const baseInputClass =
  "min-h-11 w-full max-w-full rounded border bg-[rgb(var(--app-bg-surface))] px-3 py-2.5 text-sm leading-5 focus:outline-none md:w-56 xl:w-full";
const baseSecondaryButtonClass =
  "min-h-11 w-full rounded border px-3 py-2.5 text-sm font-medium whitespace-nowrap transition md:w-auto xl:w-full";
const baseShortcutButtonClass =
  "rounded border px-3 py-1.5 text-xs font-medium transition";
const basePrimaryButtonClass =
  "min-h-11 w-full rounded px-3 py-2.5 text-sm font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50 md:w-auto xl:w-full";
const basePrimaryCompactButtonClass =
  "min-h-11 rounded px-3 py-2.5 text-sm font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50";
const baseChipClass =
  "rounded-full border px-3 py-1 text-xs font-medium transition";

export function getTransactionSectionClasses(tone: TransactionSectionTone) {
  const palette = toneStyles[tone];
  const containerBaseClass =
    tone === "gray" ? "p-4" : "rounded border border-dashed p-4";

  return {
    container: `${containerBaseClass} ${palette.container}`.trim(),
    title: `mb-3 text-sm font-semibold ${palette.title}`,
    label: `mb-1 block text-xs font-medium ${palette.label}`,
    input: `${baseInputClass} ${palette.input}`,
    secondaryButton: `${baseSecondaryButtonClass} ${palette.secondaryButton}`,
    shortcutButton: `${baseShortcutButtonClass} ${palette.shortcutButton}`,
    primaryButton: `${basePrimaryButtonClass} ${palette.primaryButton}`,
    primaryCompactButton: `${basePrimaryCompactButtonClass} ${palette.primaryCompactButton}`,
    chip: `${baseChipClass} ${palette.chip}`,
    emptyState: `text-xs ${palette.emptyState}`,
  };
}

export function TransactionSection({
  title,
  tone,
  children,
}: TransactionSectionProps) {
  const classes = getTransactionSectionClasses(tone);

  return (
    <div className={classes.container}>
      <h3 className={classes.title}>{title}</h3>
      {children}
    </div>
  );
}

export function TransactionSectionLabel({
  tone,
  children,
  htmlFor,
}: TransactionSectionLabelProps) {
  const classes = getTransactionSectionClasses(tone);

  return (
    <label htmlFor={htmlFor} className={classes.label}>
      {children}
    </label>
  );
}
