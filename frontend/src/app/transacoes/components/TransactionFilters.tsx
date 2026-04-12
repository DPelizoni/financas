"use client";

import React, { useMemo } from "react";
import { Category } from "@/types/category";
import { Bank } from "@/types/bank";
import { InputAdornment, MenuItem, TextField } from "@mui/material";
import { Search } from "lucide-react";

interface TransactionFiltersProps {
  searchTerm: string;
  filterTipo: "DESPESA" | "RECEITA" | "TODOS";
  filterCategoria: number | "TODOS";
  filterBanco: number | "TODOS";
  filterSituacao: "PENDENTE" | "PAGO" | "TODOS";
  filterMes: string;
  showFilters: boolean;
  categories: Category[];
  banks: Bank[];
  onSearch: (value: string) => void;
  onFilterTipoChange: (value: "DESPESA" | "RECEITA" | "TODOS") => void;
  onFilterCategoriaChange: (value: number | "TODOS") => void;
  onFilterBancoChange: (value: number | "TODOS") => void;
  onFilterSituacaoChange: (value: "PENDENTE" | "PAGO" | "TODOS") => void;
  onFilterMesChange: (value: string) => void;
  onClearFilters: () => void;
}

export function TransactionFilters({
  searchTerm,
  filterTipo,
  filterCategoria,
  filterBanco,
  filterSituacao,
  filterMes,
  showFilters,
  categories,
  banks,
  onSearch,
  onFilterTipoChange,
  onFilterCategoriaChange,
  onFilterBancoChange,
  onFilterSituacaoChange,
  onFilterMesChange,
  onClearFilters,
}: TransactionFiltersProps) {
  const sortedCategories = useMemo(() => {
    const categoriesByType =
      filterTipo === "TODOS"
        ? categories
        : categories.filter((category) => category.tipo === filterTipo);

    return [...categoriesByType].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [categories, filterTipo]);

  const sortedBanks = useMemo(
    () => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [banks],
  );

  if (!showFilters) return null;

  return (
    <div className="filter-panel-surface block animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Filtros Avançados</h3>
        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition dark:text-blue-400 dark:hover:text-blue-300"
        >
          Limpar tudo
        </button>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <TextField
              type="month"
              label="Mês/Ano"
              variant="outlined"
              size="small"
              fullWidth
              value={filterMes}
              onChange={(e) => onFilterMesChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </div>

          {/* Tipo */}
          <div>
            <TextField
              select
              label="Tipo"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterTipo}
              onChange={(e) => onFilterTipoChange(e.target.value as any)}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (selected === "TODOS") return "Todos";
                  return selected === "DESPESA" ? "Despesa" : "Receita";
                },
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="DESPESA">Despesa</MenuItem>
              <MenuItem value="RECEITA">Receita</MenuItem>
            </TextField>
          </div>

          {/* Categoria */}
          <div>
            <TextField
              select
              label="Categoria"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={
                filterCategoria === "TODOS"
                  ? "TODOS"
                  : String(filterCategoria)
              }
              onChange={(e) => {
                onFilterCategoriaChange(
                  e.target.value === "TODOS"
                    ? "TODOS"
                    : Number(e.target.value),
                );
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (selected === "TODOS") return "Todos";
                  const category = sortedCategories.find(
                    (cat) => String(cat.id) === selected,
                  );
                  return category?.nome ?? "Todos";
                },
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              {sortedCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {/* Banco */}
          <div>
            <TextField
              select
              label="Banco"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={
                filterBanco === "TODOS" ? "TODOS" : String(filterBanco)
              }
              onChange={(e) => {
                onFilterBancoChange(
                  e.target.value === "TODOS"
                    ? "TODOS"
                    : Number(e.target.value),
                );
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (selected === "TODOS") return "Todos";
                  const bank = sortedBanks.find(
                    (item) => String(item.id) === selected,
                  );
                  return bank?.nome ?? "Todos";
                },
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              {sortedBanks.map((bank) => (
                <MenuItem key={bank.id} value={bank.id}>
                  {bank.nome}
                </MenuItem>
              ))}
            </TextField>
          </div>

          {/* Situação */}
          <div>
            <TextField
              select
              label="Situação"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterSituacao}
              onChange={(e) => {
                onFilterSituacaoChange(
                  e.target.value as any,
                );
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (selected === "TODOS") return "Todos";
                  return selected === "PAGO" ? "Pago" : "Pendente";
                },
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="PAGO">Pago</MenuItem>
              <MenuItem value="PENDENTE">Pendente</MenuItem>
            </TextField>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2 xl:col-span-5">
            <TextField
              type="search"
              label="Buscar por descrição ou observação..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
