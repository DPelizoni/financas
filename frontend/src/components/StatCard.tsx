import { LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export type StatCardTone = "success" | "error" | "info" | "warning";

export interface StatCardComparison {
  previous: number;
  // Rótulo do período comparado, ex.: "set/2026"
  label: string;
  // true: aumento é bom (receita); false: aumento é ruim (despesa); undefined: neutro
  higherIsBetter?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  tone: StatCardTone;
  comparison?: StatCardComparison;
}

const toneClasses: Record<StatCardTone, { card: string; text: string; icon: string }> = {
  success: {
    card: "border-green-200 border-t-green-500 bg-green-50/80 dark:border-green-800/50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
    icon: "bg-green-100 text-green-600 dark:bg-green-800/40 dark:text-green-400",
  },
  error: {
    card: "border-red-200 border-t-red-500 bg-red-50/80 dark:border-red-800/50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    icon: "bg-red-100 text-red-600 dark:bg-red-800/40 dark:text-red-400",
  },
  info: {
    card: "border-blue-200 border-t-blue-500 bg-blue-50/80 dark:border-blue-800/50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-800/40 dark:text-blue-400",
  },
  warning: {
    card: "border-amber-200 border-t-amber-500 bg-amber-50/80 dark:border-amber-800/50 dark:bg-amber-900/20",
    text: "text-amber-800 dark:text-amber-200",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-800/40 dark:text-amber-300",
  },
};

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

function Comparison({ value, comparison }: { value: number; comparison: StatCardComparison }) {
  const { previous, label, higherIsBetter } = comparison;

  if (previous === 0) {
    return (
      <p className="mt-2 text-xs text-[rgb(var(--app-text-muted))]">
        Sem base de comparação em {label}
      </p>
    );
  }

  const change = ((value - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(change * 10) / 10;

  if (rounded === 0) {
    return (
      <p className="mt-2 flex items-center gap-1 text-xs text-[rgb(var(--app-text-muted))]">
        <Minus size={14} aria-hidden="true" />
        Igual a {label}
      </p>
    );
  }

  const increased = rounded > 0;
  const isGood = higherIsBetter === undefined ? null : increased === higherIsBetter;
  const colorClass =
    isGood === null
      ? "text-[rgb(var(--app-text-secondary))]"
      : isGood
        ? "text-[rgb(var(--app-status-success-text))]"
        : "text-[rgb(var(--app-status-error-text))]";
  const Icon = increased ? TrendingUp : TrendingDown;

  return (
    <p className="mt-2 flex items-center gap-1 text-xs">
      <span className={`inline-flex items-center gap-1 font-semibold ${colorClass}`}>
        <Icon size={14} aria-hidden="true" />
        {increased ? "+" : "−"}
        {percentFormatter.format(Math.abs(rounded))}%
      </span>
      <span className="text-[rgb(var(--app-text-muted))]">vs. {label}</span>
    </p>
  );
}

export default function StatCard({ title, value, icon: Icon, tone, comparison }: StatCardProps) {
  const classes = toneClasses[tone];
  const formatted = formatCurrency(value);

  return (
    <div className={`kpi-card rounded-lg border border-t-4 p-5 ${classes.card}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className={`text-sm font-semibold opacity-80 ${classes.text}`}>{title}</p>
          <p
            className={`kpi-value mt-1 whitespace-nowrap font-bold tabular-nums tracking-tight ${classes.text}`}
            title={formatted}
          >
            {formatted}
          </p>
        </div>
        <div className={`shrink-0 rounded-md p-2.5 ${classes.icon}`}>
          <Icon size={24} aria-hidden="true" />
        </div>
      </div>
      {comparison && <Comparison value={value} comparison={comparison} />}
    </div>
  );
}
