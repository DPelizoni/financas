import { MenuItem, TextField } from "@mui/material";
import { Bank } from "@/types/bank";
import { Category } from "@/types/category";

interface DashboardFiltersProps {
  showFilters: boolean;
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
  currentYear: string;
}

export function DashboardFilters({
  showFilters,
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
  currentYear,
}: DashboardFiltersProps) {
  if (!showFilters) return null;

  const handleClearFilters = () => {
    setFilterMesAno("");
    setFilterAno(currentYear);
    setFilterTipo("TODOS");
    setFilterSituacao("TODOS");
    setFilterCategoria("TODOS");
    setFilterBanco("TODOS");
    setPeriodMonths(12);
  };

  return (
    <div className="filter-panel-surface animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-sm font-semibold text-gray-700">Filtros de Análise</h3>
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
        >
          Limpar tudo
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <TextField
            select
            label="Período"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={periodMonths}
            onChange={(e) => setPeriodMonths(Number(e.target.value))}
            disabled={Boolean(filterMesAno)}
          >
            <MenuItem value={3}>Últimos 3 meses</MenuItem>
            <MenuItem value={6}>Últimos 6 meses</MenuItem>
            <MenuItem value={12}>Últimos 12 meses</MenuItem>
          </TextField>
        </div>

        <div>
          <TextField
            type="month"
            label="Mês Específico"
            variant="outlined"
            size="small"
            fullWidth
            value={filterMesAno}
            onChange={(e) => setFilterMesAno(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </div>

        <div>
          <TextField
            select
            label="Ano Base"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterAno}
            onChange={(e) => setFilterAno(e.target.value)}
            disabled={Boolean(filterMesAno)}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div>
          <TextField
            select
            label="Tipo de Fluxo"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterTipo}
            onChange={(e) =>
              setFilterTipo(
                e.target.value as "TODOS" | "DESPESA" | "RECEITA",
              )
            }
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="DESPESA">Apenas Despesas</MenuItem>
            <MenuItem value="RECEITA">Apenas Receitas</MenuItem>
          </TextField>
        </div>

        <div>
          <TextField
            select
            label="Status"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterSituacao}
            onChange={(e) =>
              setFilterSituacao(
                e.target.value as "TODOS" | "PENDENTE" | "PAGO",
              )
            }
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="PAGO">Somente Pagos</MenuItem>
            <MenuItem value="PENDENTE">Somente Pendentes</MenuItem>
          </TextField>
        </div>

        <div>
          <TextField
            select
            label="Instituição/Banco"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterBanco}
            onChange={(e) =>
              setFilterBanco(
                e.target.value === "TODOS"
                  ? "TODOS"
                  : Number(e.target.value),
              )
            }
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            {sortedBanks.map((bank) => (
              <MenuItem key={bank.id} value={bank.id}>
                {bank.nome}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <div>
          <TextField
            select
            label="Categoria de Gasto"
            variant="outlined"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={filterCategoria}
            onChange={(e) =>
              setFilterCategoria(
                e.target.value === "TODOS"
                  ? "TODOS"
                  : Number(e.target.value),
              )
            }
          >
            <MenuItem value="TODOS">Todas</MenuItem>
            {sortedCategories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.nome}
              </MenuItem>
            ))}
          </TextField>
        </div>
      </div>
    </div>
  );
}
