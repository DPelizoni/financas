"use client";

import { MenuItem, TextField } from "@mui/material";
import { CategoryType } from "@/types/category";
import FilterBar from "@/components/FilterBar";
import { FilterChip } from "@/components/FilterChips";

interface CategoryFiltersProps {
  searchTerm: string;
  filterTipo: CategoryType | "TODOS";
  filterAtivo: boolean | undefined;
  onSearch: (value: string) => void;
  onFilterTipoChange: (value: CategoryType | "TODOS") => void;
  onFilterAtivoChange: (value: boolean | undefined) => void;
  onClearFilters: () => void;
}

export function CategoryFilters({
  searchTerm,
  filterTipo,
  filterAtivo,
  onSearch,
  onFilterTipoChange,
  onFilterAtivoChange,
  onClearFilters,
}: CategoryFiltersProps) {
  const chips: FilterChip[] = [];
  if (searchTerm) {
    chips.push({ key: "busca", label: `Busca: “${searchTerm}”`, onRemove: () => onSearch("") });
  }
  if (filterTipo !== "TODOS") {
    chips.push({
      key: "tipo",
      label: `Tipo: ${filterTipo === "DESPESA" ? "Despesas" : "Receitas"}`,
      onRemove: () => onFilterTipoChange("TODOS"),
    });
  }
  if (filterAtivo !== undefined) {
    chips.push({
      key: "status",
      label: `Status: ${filterAtivo ? "Ativos" : "Inativos"}`,
      onRemove: () => onFilterAtivoChange(undefined),
    });
  }

  const advancedCount = (filterTipo !== "TODOS" ? 1 : 0) + (filterAtivo !== undefined ? 1 : 0);

  return (
    <FilterBar
      label="Filtros de categorias"
      search={{ value: searchTerm, onChange: onSearch, placeholder: "Buscar categoria por nome" }}
      advancedCount={advancedCount}
      chips={chips}
      onClearAll={onClearFilters}
      advanced={
        <>
          <TextField
            select
            label="Tipo"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterTipo}
            onChange={(e) => onFilterTipoChange(e.target.value as CategoryType | "TODOS")}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="DESPESA">Despesas</MenuItem>
            <MenuItem value="RECEITA">Receitas</MenuItem>
          </TextField>

          <TextField
            select
            label="Status"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterAtivo === undefined ? "TODOS" : filterAtivo.toString()}
            onChange={(e) => {
              const val = e.target.value;
              onFilterAtivoChange(val === "TODOS" ? undefined : val === "true");
            }}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="true">Ativos</MenuItem>
            <MenuItem value="false">Inativos</MenuItem>
          </TextField>
        </>
      }
    />
  );
}
