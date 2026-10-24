import { MenuItem, TextField } from "@mui/material";
import { Bank } from "@/types/bank";
import { Category } from "@/types/category";
import FilterBar from "@/components/FilterBar";
import { FilterChip } from "@/components/FilterChips";
import MonthSwitcher from "@/components/MonthSwitcher";

interface DashboardFiltersProps {
  periodMonths: number;
  setPeriodMonths: (value: number) => void;
  filterMesAno: string;
  setFilterMesAno: (value: string) => void;
  filterAno: string;
  setFilterAno: (value: string) => void;
  filterTipo: "TODOS" | "DESPESA" | "RECEITA";
  setFilterTipo: (value: "TODOS" | "DESPESA" | "RECEITA") => void;
  filterSituacao: "TODOS" | "PENDENTE" | "PAGO";
  setFilterSituacao: (value: "TODOS" | "PENDENTE" | "PAGO") => void;
  filterBanco: number | "TODOS";
  setFilterBanco: (value: number | "TODOS") => void;
  filterCategoria: number | "TODOS";
  setFilterCategoria: (value: number | "TODOS") => void;
  availableYears: string[];
  sortedBanks: Bank[];
  sortedCategories: Category[];
  onClearFilters: () => void;
}

const DEFAULT_PERIOD_MONTHS = 12;

export function DashboardFilters({
  periodMonths,
  setPeriodMonths,
  filterMesAno,
  setFilterMesAno,
  filterAno,
  setFilterAno,
  filterTipo,
  setFilterTipo,
  filterSituacao,
  setFilterSituacao,
  filterBanco,
  setFilterBanco,
  filterCategoria,
  setFilterCategoria,
  availableYears,
  sortedBanks,
  sortedCategories,
  onClearFilters,
}: DashboardFiltersProps) {
  // Período e ano só valem quando nenhum mês específico está selecionado
  const usesPeriod = !filterMesAno;

  const chips: FilterChip[] = [];
  if (usesPeriod && periodMonths !== DEFAULT_PERIOD_MONTHS) {
    chips.push({
      key: "periodo",
      label: `Período: últimos ${periodMonths} meses`,
      onRemove: () => setPeriodMonths(DEFAULT_PERIOD_MONTHS),
    });
  }
  if (usesPeriod && filterAno !== "TODOS") {
    chips.push({ key: "ano", label: `Ano: ${filterAno}`, onRemove: () => setFilterAno("TODOS") });
  }
  if (filterTipo !== "TODOS") {
    chips.push({
      key: "tipo",
      label: `Tipo: ${filterTipo === "DESPESA" ? "Despesas" : "Receitas"}`,
      onRemove: () => setFilterTipo("TODOS"),
    });
  }
  if (filterSituacao !== "TODOS") {
    chips.push({
      key: "situacao",
      label: `Situação: ${filterSituacao === "PAGO" ? "Pagos" : "Pendentes"}`,
      onRemove: () => setFilterSituacao("TODOS"),
    });
  }
  if (filterBanco !== "TODOS") {
    const nome = sortedBanks.find((bank) => bank.id === filterBanco)?.nome ?? `#${filterBanco}`;
    chips.push({ key: "banco", label: `Banco: ${nome}`, onRemove: () => setFilterBanco("TODOS") });
  }
  if (filterCategoria !== "TODOS") {
    const nome = sortedCategories.find((cat) => cat.id === filterCategoria)?.nome ?? `#${filterCategoria}`;
    chips.push({ key: "categoria", label: `Categoria: ${nome}`, onRemove: () => setFilterCategoria("TODOS") });
  }

  const advancedCount =
    (usesPeriod && periodMonths !== DEFAULT_PERIOD_MONTHS ? 1 : 0) +
    (usesPeriod && filterAno !== "TODOS" ? 1 : 0) +
    [filterTipo, filterSituacao, filterBanco, filterCategoria].filter((value) => value !== "TODOS").length;

  return (
    <FilterBar
      label="Filtros do dashboard"
      leading={<MonthSwitcher value={filterMesAno} onChange={setFilterMesAno} allowAll />}
      advancedCount={advancedCount}
      chips={chips}
      onClearAll={onClearFilters}
      advanced={
        <>
          <TextField
            select
            label="Período"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={periodMonths}
            onChange={(e) => setPeriodMonths(Number(e.target.value))}
            disabled={!usesPeriod}
            helperText={!usesPeriod ? "Selecione “Todos os meses” para usar" : undefined}
          >
            <MenuItem value={3}>Últimos 3 meses</MenuItem>
            <MenuItem value={6}>Últimos 6 meses</MenuItem>
            <MenuItem value={12}>Últimos 12 meses</MenuItem>
          </TextField>

          <TextField
            select
            label="Ano"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterAno}
            onChange={(e) => setFilterAno(e.target.value)}
            disabled={!usesPeriod}
            helperText={!usesPeriod ? "Selecione “Todos os meses” para usar" : undefined}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Tipo"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as "TODOS" | "DESPESA" | "RECEITA")}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="DESPESA">Despesas</MenuItem>
            <MenuItem value="RECEITA">Receitas</MenuItem>
          </TextField>

          <TextField
            select
            label="Situação"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterSituacao}
            onChange={(e) => setFilterSituacao(e.target.value as "TODOS" | "PENDENTE" | "PAGO")}
          >
            <MenuItem value="TODOS">Todas</MenuItem>
            <MenuItem value="PAGO">Pagos</MenuItem>
            <MenuItem value="PENDENTE">Pendentes</MenuItem>
          </TextField>

          <TextField
            select
            label="Banco"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterBanco}
            onChange={(e) => setFilterBanco(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value))}
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
            label="Categoria"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value))}
          >
            <MenuItem value="TODOS">Todas</MenuItem>
            {sortedCategories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.nome}
              </MenuItem>
            ))}
          </TextField>
        </>
      }
    />
  );
}
