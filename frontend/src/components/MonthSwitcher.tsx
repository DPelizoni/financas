"use client";

import { useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthYearLabel } from "@/utils/format";

interface MonthSwitcherProps {
  // "AAAA-MM"; vazio significa todos os meses
  value: string;
  onChange: (value: string) => void;
  // Exibe o atalho "Todos os meses" (valor vazio)
  allowAll?: boolean;
}

export const currentMonthValue = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const shiftMonth = (value: string, offset: number): string => {
  const [year, month] = (value || currentMonthValue()).split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const navButtonClass =
  "flex h-10 w-10 items-center justify-center text-[rgb(var(--app-text-secondary))] transition-colors hover:bg-[rgb(var(--app-bg-muted))] hover:text-[rgb(var(--app-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--app-focus-ring))]";

const linkButtonClass =
  "whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium text-[rgb(var(--app-brand-primary))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-focus-ring))]";

export default function MonthSwitcher({ value, onChange, allowAll = false }: MonthSwitcherProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = value ? capitalize(formatMonthYearLabel(value)) : "Todos os meses";
  const isCurrentMonth = value === currentMonthValue();

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      <div className="inline-flex items-center overflow-hidden rounded-md border border-[rgb(var(--app-border-default))] bg-[rgb(var(--app-bg-surface))]">
        <button
          type="button"
          onClick={() => onChange(shiftMonth(value, -1))}
          className={navButtonClass}
          aria-label="Mês anterior"
          title="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="relative border-x border-[rgb(var(--app-border-default))]">
          <button
            type="button"
            onClick={openPicker}
            className="flex h-10 min-w-[11rem] items-center justify-center gap-2 px-3 text-sm font-semibold text-[rgb(var(--app-text-primary))] transition-colors hover:bg-[rgb(var(--app-bg-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--app-focus-ring))]"
            aria-label={`Período: ${label}. Escolher mês`}
          >
            <CalendarDays size={16} className="text-[rgb(var(--app-text-muted))]" />
            {label}
          </button>
          <input
            ref={inputRef}
            type="month"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          />
        </div>

        <button
          type="button"
          onClick={() => onChange(shiftMonth(value, 1))}
          className={navButtonClass}
          aria-label="Próximo mês"
          title="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {!isCurrentMonth && (
        <button type="button" onClick={() => onChange(currentMonthValue())} className={linkButtonClass}>
          Mês atual
        </button>
      )}
      {allowAll && value && (
        <button type="button" onClick={() => onChange("")} className={linkButtonClass}>
          Todos os meses
        </button>
      )}
    </div>
  );
}
