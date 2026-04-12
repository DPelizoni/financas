"use client";

import { Search, X } from "lucide-react";
import { IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";
import AppButton from "@/components/AppButton";
import { CategoryType } from "@/types/category";
import { useEffect, useState } from "react";

interface CategoryFiltersProps {
  searchTerm: string;
  filterTipo: CategoryType | "TODOS";
  filterAtivo: boolean | undefined;
  showFilters: boolean;
  onSearch: (value: string) => void;
  onFilterTipoChange: (value: CategoryType | "TODOS") => void;
  onFilterAtivoChange: (value: boolean | undefined) => void;
  onClearFilters: () => void;
}

export function CategoryFilters({
  searchTerm,
  filterTipo,
  filterAtivo,
  showFilters,
  onSearch,
  onFilterTipoChange,
  onFilterAtivoChange,
  onClearFilters,
}: CategoryFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Sincroniza o busca local quando o searchTerm muda externamente (ex: ao limpar filtros)
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Debounce para a busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearch(localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, onSearch, searchTerm]);

  if (!showFilters) return null;

  return (
    <div className="filter-panel-surface animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          Filtros de Categorias
        </h3>
        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition dark:text-blue-400 dark:hover:text-blue-300"
        >
          Limpar tudo
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <TextField
            type="text"
            label="Buscar por nome"
            variant="outlined"
            size="small"
            fullWidth
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} className="text-gray-400" />
                </InputAdornment>
              ),
              endAdornment: localSearch ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setLocalSearch("");
                      onSearch("");
                    }}
                    aria-label="Limpar pesquisa"
                  >
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
        </div>

        <TextField
          select
          label="Tipo"
          variant="outlined"
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={filterTipo}
          onChange={(e) => {
            onFilterTipoChange(e.target.value as CategoryType | "TODOS");
          }}
        >
          <MenuItem value="TODOS">Todos os tipos</MenuItem>
          <MenuItem value="DESPESA">Somente Despesas</MenuItem>
          <MenuItem value="RECEITA">Somente Receitas</MenuItem>
        </TextField>

        <div className="flex flex-wrap gap-2 md:col-span-3">
          <span className="mr-2 flex items-center text-xs font-medium text-gray-500 dark:text-slate-400">
            Status:
          </span>
          <AppButton
            onClick={() => onFilterAtivoChange(undefined)}
            tone={filterAtivo === undefined ? "primary" : "outline-primary"}
            size="sm"
          >
            Todos
          </AppButton>
          <AppButton
            onClick={() => onFilterAtivoChange(true)}
            tone={filterAtivo === true ? "success" : "outline-success"}
            size="sm"
          >
            Ativos
          </AppButton>
          <AppButton
            onClick={() => onFilterAtivoChange(false)}
            tone={filterAtivo === false ? "danger" : "outline-danger"}
            size="sm"
          >
            Inativos
          </AppButton>
        </div>
      </div>
    </div>
  );
}
