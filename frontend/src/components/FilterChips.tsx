import { X } from "lucide-react";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll: () => void;
}

export default function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--app-brand-primary)/0.3)] bg-[rgb(var(--app-brand-primary)/0.08)] py-1 pl-3 pr-1 text-xs font-medium text-[rgb(var(--app-brand-primary))]"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-[rgb(var(--app-brand-primary)/0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-focus-ring))]"
            aria-label={`Remover filtro ${chip.label}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded-md px-2 py-1 text-xs font-medium text-[rgb(var(--app-text-secondary))] hover:text-[rgb(var(--app-text-primary))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-focus-ring))]"
      >
        Limpar filtros
      </button>
    </div>
  );
}
