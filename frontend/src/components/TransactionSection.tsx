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
    container: "border-blue-200 bg-blue-50",
    title: "text-blue-900",
    label: "text-blue-900",
    input: "border-blue-200 focus:border-blue-500",
    secondaryButton: "border-blue-300 bg-white text-blue-700 hover:bg-blue-100",
    shortcutButton: "border-blue-300 bg-white text-blue-700 hover:bg-blue-100",
    primaryButton: "bg-blue-600 text-white hover:bg-blue-700",
    primaryCompactButton: "bg-blue-600 text-white hover:bg-blue-700",
    chip: "border-blue-300 bg-white text-blue-800 hover:bg-blue-100",
    emptyState: "text-blue-800",
  },
  red: {
    container: "border-red-200 bg-red-50",
    title: "text-red-900",
    label: "text-red-900",
    input: "border-red-200 focus:border-red-500",
    secondaryButton: "border-red-300 bg-white text-red-700 hover:bg-red-100",
    shortcutButton: "border-red-300 bg-white text-red-700 hover:bg-red-100",
    primaryButton: "bg-red-600 text-white hover:bg-red-700",
    primaryCompactButton: "bg-red-600 text-white hover:bg-red-700",
    chip: "border-red-300 bg-white text-red-800 hover:bg-red-100",
    emptyState: "text-red-800",
  },
  gray: {
    container: "border-gray-300 bg-gray-50",
    title: "text-gray-800",
    label: "text-gray-800",
    input: "border-gray-300 focus:border-gray-500",
    secondaryButton: "border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
    shortcutButton: "border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
    primaryButton: "bg-gray-500 text-white hover:bg-gray-600",
    primaryCompactButton: "bg-gray-500 text-white hover:bg-gray-600",
    chip: "border-gray-300 bg-white text-gray-800 hover:bg-gray-100",
    emptyState: "text-gray-700",
  },
};

const baseInputClass =
  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none";
const baseSecondaryButtonClass =
  "w-full rounded-lg border px-3 py-2 text-sm font-medium transition";
const baseShortcutButtonClass =
  "rounded-lg border px-3 py-1 text-xs font-medium transition";
const basePrimaryButtonClass =
  "w-full rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
const basePrimaryCompactButtonClass =
  "rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
const baseChipClass =
  "rounded-full border px-3 py-1 text-xs font-medium transition";

export function getTransactionSectionClasses(tone: TransactionSectionTone) {
  const palette = toneStyles[tone];

  return {
    container: `mb-4 rounded-lg border border-dashed p-4 ${palette.container}`,
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
