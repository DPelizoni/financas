"use client";

import React, { useMemo } from "react";
import { Category } from "@/types/category";
import { Bank } from "@/types/bank";
import { MenuItem, TextField } from "@mui/material";
import MonthSwitcher from "@/components/MonthSwitcher";
import FilterBar from "@/components/FilterBar";
import { FilterChip } from "@/components/FilterChips";

interface TransactionFiltersProps {
  searchTerm: string;
  filterTipo: "DESPESA" | "RECEITA" | "TODOS";
  filterCategoria: number | "TODOS";
  filterBanco: number | "TODOS";
  filterSituacao: "PENDENTE" | "PAGO" | "TODOS";
  filterMes: string;
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

const tipoLabel = { DESPESA: "Despesa", RECEITA: "Receita" } as const;
const situacaoLabel = { PAGO: "Pago", PENDENTE: "Pendente" } as const;

export function TransactionFilters({
  searchTerm,
  filterTipo,
  filterCategoria,
  filterBanco,
  filterSituacao,
  filterMes,
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

  const chips = useMemo(() => {
    const list: FilterChip[] = [];
    if (searchTerm) {
      list.push({ key: "busca", label: `Busca: “${searchTerm}”`, onRemove: () => onSearch("") });
    }
    if (filterTipo !== "TODOS") {
      list.push({ key: "tipo", label: `Tipo: ${tipoLabel[filterTipo]}`, onRemove: () => onFilterTipoChange("TODOS") });
    }
    if (filterCategoria !== "TODOS") {
      const nome = categories.find((cat) => cat.id === filterCategoria)?.nome ?? `#${filterCategoria}`;
      list.push({ key: "categoria", label: `Categoria: ${nome}`, onRemove: () => onFilterCategoriaChange("TODOS") });
    }
    if (filterBanco !== "TODOS") {
      const nome = banks.find((bank) => bank.id === filterBanco)?.nome ?? `#${filterBanco}`;
      list.push({ key: "banco", label: `Banco: ${nome}`, onRemove: () => onFilterBancoChange("TODOS") });
    }
    if (filterSituacao !== "TODOS") {
      list.push({ key: "situacao", label: `Situação: ${situacaoLabel[filterSituacao]}`, onRemove: () => onFilterSituacaoChange("TODOS") });
    }
    return list;
  }, [
    searchTerm,
    filterTipo,
    filterCategoria,
    filterBanco,
    filterSituacao,
    categories,
    banks,
    onSearch,
    onFilterTipoChange,
    onFilterCategoriaChange,
    onFilterBancoChange,
    onFilterSituacaoChange,
  ]);

  // Filtros do painel "Mais filtros" (busca e mês ficam sempre visíveis)
  const advancedCount = [filterTipo, filterCategoria, filterBanco, filterSituacao].filter(
    (value) => value !== "TODOS",
  ).length;

  return (
    <FilterBar
      label="Filtros de transações"
      leading={<MonthSwitcher value={filterMes} onChange={onFilterMesChange} allowAll />}
      search={{
        value: searchTerm,
        onChange: onSearch,
        placeholder: "Buscar por descrição ou observação",
      }}
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
            onChange={(e) => onFilterTipoChange(e.target.value as "DESPESA" | "RECEITA" | "TODOS")}
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

          <TextField
            select
            label="Categoria"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterCategoria === "TODOS" ? "TODOS" : String(filterCategoria)}
            onChange={(e) => {
              onFilterCategoriaChange(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value));
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === "TODOS") return "Todas";
                const category = sortedCategories.find((cat) => String(cat.id) === selected);
                return category?.nome ?? "Todas";
              },
            }}
          >
            <MenuItem value="TODOS">Todas</MenuItem>
            {sortedCategories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.nome}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Banco"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterBanco === "TODOS" ? "TODOS" : String(filterBanco)}
            onChange={(e) => {
              onFilterBancoChange(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value));
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === "TODOS") return "Todos";
                const bank = sortedBanks.find((item) => String(item.id) === selected);
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

          <TextField
            select
            label="Situação"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterSituacao}
            onChange={(e) => onFilterSituacaoChange(e.target.value as "PENDENTE" | "PAGO" | "TODOS")}
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => {
                if (selected === "TODOS") return "Todas";
                return selected === "PAGO" ? "Pago" : "Pendente";
              },
            }}
          >
            <MenuItem value="TODOS">Todas</MenuItem>
            <MenuItem value="PAGO">Pago</MenuItem>
            <MenuItem value="PENDENTE">Pendente</MenuItem>
          </TextField>
        </>
      }
    />
  );
}
