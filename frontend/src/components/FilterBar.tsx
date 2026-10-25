"use client";

import { ReactNode, useEffect, useState } from "react";
import { InputAdornment, TextField } from "@mui/material";
import { Search, SlidersHorizontal } from "lucide-react";
import AppButton from "@/components/AppButton";
import FilterChips, { FilterChip } from "@/components/FilterChips";

interface FilterBarProps {
  label: string;
  // Controle principal à esquerda (ex.: seletor de mês)
  leading?: ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  // Campos do painel "Filtros"; quando ausente, o botão não aparece
  advanced?: ReactNode;
  advancedCount?: number;
  chips: FilterChip[];
  onClearAll: () => void;
}

export default function FilterBar({
  label,
  leading,
  search,
  advanced,
  advancedCount = 0,
  chips,
  onClearAll,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localSearch, setLocalSearch] = useState(search?.value ?? "");
  const searchValue = search?.value ?? "";
  const onSearchChange = search?.onChange;

  // Acompanha mudanças externas da busca (ex.: chip removido, "Limpar filtros", valor vindo da URL)
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  // Debounce: só aplica a busca depois que a pessoa para de digitar
  useEffect(() => {
    if (!onSearchChange || localSearch === searchValue) return;
    const timer = setTimeout(() => onSearchChange(localSearch), 400);
    return () => clearTimeout(timer);
  }, [localSearch, searchValue, onSearchChange]);

  return (
    <section className="app-surface space-y-3 p-4" aria-label={label}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {leading}

        <div className="flex flex-1 gap-2">
          {search ? (
            <TextField
              type="search"
              placeholder={search.placeholder}
              variant="outlined"
              size="small"
              fullWidth
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              inputProps={{ "aria-label": search.placeholder }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} className="text-neutral-400" />
                  </InputAdornment>
                ),
              }}
            />
          ) : (
            <div className="flex-1" />
          )}

          {advanced && (
            <AppButton
              tone={showAdvanced || advancedCount > 0 ? "outline-primary" : "outline"}
              onClick={() => setShowAdvanced((prev) => !prev)}
              startIcon={<SlidersHorizontal size={16} />}
              aria-expanded={showAdvanced}
              className="h-10 shrink-0"
            >
              Filtros{advancedCount > 0 ? ` (${advancedCount})` : ""}
            </AppButton>
          )}
        </div>
      </div>

      {advanced && showAdvanced && (
        <div className="grid grid-cols-1 gap-3 border-t border-[rgb(var(--app-border-subtle))] pt-3 sm:grid-cols-2 xl:grid-cols-4">
          {advanced}
        </div>
      )}

      <FilterChips chips={chips} onClearAll={onClearAll} />
    </section>
  );
}
