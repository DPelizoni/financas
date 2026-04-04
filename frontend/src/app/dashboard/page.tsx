"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  DollarSign,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
import Icon from "@mdi/react";
import { mdiBroom } from "@mdi/js";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { transacaoService } from "@/services/transacaoService";
import { categoryService } from "@/services/categoryService";
import { bankService } from "@/services/bankService";
import { Transacao } from "@/types/transacao";
import { Category } from "@/types/category";
import { Bank } from "@/types/bank";
import FeedbackAlert from "@/components/FeedbackAlert";
import PageContainer from "@/components/PageContainer";
import { MenuItem, TextField } from "@mui/material";

interface MonthlyPoint {
  monthKey: string;
  monthLabel: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

const tipoLabel: Record<"DESPESA" | "RECEITA", string> = {
  DESPESA: "Despesa",
  RECEITA: "Receita",
};

const situacaoLabel: Record<"PENDENTE" | "PAGO", string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
};

const chartColors = {
  receitas: "rgb(var(--app-chart-receita))",
  despesas: "rgb(var(--app-chart-despesa))",
  saldo: "rgb(var(--app-chart-saldo))",
  pendente: "rgb(var(--app-chart-pendente))",
  pago: "rgb(var(--app-chart-pago))",
  pieA: "rgb(var(--app-chart-pie-a))",
  pieB: "rgb(var(--app-chart-pie-b))",
  pieC: "rgb(var(--app-chart-pie-c))",
  pieD: "rgb(var(--app-chart-pie-d))",
  pieE: "rgb(var(--app-chart-pie-e))",
};

const normalizeSeriesKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getTooltipSeriesColor = (
  seriesName: string,
  fallback = "rgb(var(--app-text-primary))",
): string => {
  const normalized = normalizeSeriesKey(seriesName || "");

  if (normalized.includes("receita")) return chartColors.receitas;
  if (normalized.includes("despesa")) return chartColors.despesas;
  if (normalized.includes("saldo") || normalized.includes("liquido")) {
    return chartColors.saldo;
  }
  if (normalized.includes("pago")) return chartColors.pago;
  if (normalized.includes("provisao") || normalized.includes("pendente")) {
    return chartColors.pendente;
  }

  return fallback;
};

const monthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split("-");
  return `${month}/${year.slice(2)}`;
};

const parseMesToKey = (mes: string): string | null => {
  if (/^\d{2}\/\d{4}$/.test(mes)) {
    const [m, y] = mes.split("/");
    return `${y}-${m}`;
  }

  if (/^\d{4}-\d{2}$/.test(mes)) {
    return mes;
  }

  return null;
};

const monthInputToApi = (monthInput: string): string | undefined => {
  if (!monthInput) return undefined;
  const [year, month] = monthInput.split("-");
  if (!year || !month) return undefined;
  return `${month}/${year}`;
};

const currency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);

export default function DashboardPage() {
  const currentYear = String(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Filtros globais
  const [periodMonths, setPeriodMonths] = useState(12);
  const [filterTipo, setFilterTipo] = useState<
    "TODOS" | "DESPESA" | "RECEITA"
  >("TODOS");
  const [filterSituacao, setFilterSituacao] = useState<
    "TODOS" | "PENDENTE" | "PAGO"
  >("TODOS");
  const [filterCategoria, setFilterCategoria] = useState<number | "TODOS">(
    "TODOS",
  );
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [filterMesAno, setFilterMesAno] = useState("");
  const [filterAno, setFilterAno] = useState<string>(currentYear);
  const [tableSortBy, setTableSortBy] = useState<
    "mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor"
  >("mes");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">(
    "asc",
  );

  const handleTableSort = (
    column: "mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor",
  ) => {
    if (tableSortBy === column) {
      setTableSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setTableSortBy(column);
    setTableSortDirection("asc");
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [transacoesResp, categoriesResp, banksResp] = await Promise.all([
          transacaoService.getAll({ page: 1, limit: 5000 }),
          categoryService.getAll({ page: 1, limit: 1000 }),
          bankService.getAll({ page: 1, limit: 1000 }),
        ]);

        setTransacoes(transacoesResp.data || []);
        setCategories(categoriesResp.data || []);
        setBanks(banksResp.data || []);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        setFeedback({
          type: "error",
          message:
            "Não foi possível carregar os dados do dashboard. Verifique a conexão com a API.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const filteredTransacoes = useMemo(() => {
    return transacoes.filter((t) => {
      const mesKey = parseMesToKey(t.mes);
      if (!mesKey) return false;

      if (filterTipo !== "TODOS" && t.tipo !== filterTipo) return false;
      if (filterSituacao !== "TODOS" && t.situacao !== filterSituacao)
        return false;
      if (filterCategoria !== "TODOS" && t.categoria_id !== filterCategoria)
        return false;
      if (filterBanco !== "TODOS" && t.banco_id !== filterBanco) return false;
      if (filterMesAno && mesKey !== filterMesAno) return false;
      if (
        filterAno !== "TODOS" &&
        !filterMesAno &&
        !mesKey.startsWith(`${filterAno}-`)
      )
        return false;

      return true;
    });
  }, [
    transacoes,
    filterTipo,
    filterSituacao,
    filterCategoria,
    filterBanco,
    filterMesAno,
    filterAno,
  ]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentYear);
    transacoes.forEach((t) => {
      const key = parseMesToKey(t.mes);
      if (!key) return;
      years.add(key.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transacoes, currentYear]);

  const timeline = useMemo(() => {
    const allMonthsSet = new Set<string>();

    filteredTransacoes.forEach((t) => {
      const month = parseMesToKey(t.mes);
      if (month) allMonthsSet.add(month);
    });

    const sortedMonths = Array.from(allMonthsSet).sort();
    const selectedMonths = sortedMonths.slice(-periodMonths);

    const points: MonthlyPoint[] = selectedMonths.map((monthKey) => {
      const monthItems = filteredTransacoes.filter(
        (t) => parseMesToKey(t.mes) === monthKey,
      );

      const receitas = monthItems
        .filter((t) => t.tipo === "RECEITA")
        .reduce((acc, t) => acc + Number(t.valor), 0);

      const despesas = monthItems
        .filter((t) => t.tipo === "DESPESA")
        .reduce((acc, t) => acc + Number(t.valor), 0);

      return {
        monthKey,
        monthLabel: monthLabel(monthKey),
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });

    return points;
  }, [filteredTransacoes, periodMonths]);

  const periodFilteredTransacoes = useMemo(() => {
    if (filterMesAno) {
      return filteredTransacoes;
    }

    const months = Array.from(
      new Set(
        filteredTransacoes
          .map((t) => parseMesToKey(t.mes))
          .filter((m): m is string => Boolean(m)),
      ),
    )
      .sort()
      .slice(-periodMonths);

    const selectedMonths = new Set(months);

    return filteredTransacoes.filter((t) => {
      const key = parseMesToKey(t.mes);
      return key ? selectedMonths.has(key) : false;
    });
  }, [filteredTransacoes, filterMesAno, periodMonths]);

  const summaryCards = useMemo(() => {
    const totalReceita = periodFilteredTransacoes
      .filter((t) => t.tipo === "RECEITA")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const totalDespesa = periodFilteredTransacoes
      .filter((t) => t.tipo === "DESPESA")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const pagoReceita = periodFilteredTransacoes
      .filter((t) => t.tipo === "RECEITA" && t.situacao === "PAGO")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const pagoDespesa = periodFilteredTransacoes
      .filter((t) => t.tipo === "DESPESA" && t.situacao === "PAGO")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const provisaoReceita = periodFilteredTransacoes
      .filter((t) => t.tipo === "RECEITA" && t.situacao === "PENDENTE")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const provisaoDespesa = periodFilteredTransacoes
      .filter((t) => t.tipo === "DESPESA" && t.situacao === "PENDENTE")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    return {
      total_receita: totalReceita,
      total_despesa: totalDespesa,
      total_liquido: totalReceita - totalDespesa,
      pago_receita: pagoReceita,
      pago_despesa: pagoDespesa,
      pago_liquido: pagoReceita - pagoDespesa,
      provisao_receita: provisaoReceita,
      provisao_despesa: provisaoDespesa,
      provisao_liquido: provisaoReceita - provisaoDespesa,
    };
  }, [periodFilteredTransacoes]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();

    filteredTransacoes.forEach((t) => {
      const key = t.categoria_nome || `Categoria #${t.categoria_id}`;
      map.set(key, (map.get(key) || 0) + Number(t.valor));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredTransacoes]);

  const comparisonData = useMemo(
    () => [
      {
        name: "Receita",
        Pago: summaryCards.pago_receita,
        Provisao: summaryCards.provisao_receita,
      },
      {
        name: "Despesa",
        Pago: summaryCards.pago_despesa,
        Provisao: summaryCards.provisao_despesa,
      },
      {
        name: "Líquido",
        Pago: summaryCards.pago_liquido,
        Provisao: summaryCards.provisao_liquido,
      },
    ],
    [summaryCards],
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [categories],
  );

  const sortedBanks = useMemo(
    () => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [banks],
  );

  const detailedRows = useMemo(() => {
    const direction = tableSortDirection === "asc" ? 1 : -1;
    return [...filteredTransacoes]
      .sort((a, b) => {
        if (tableSortBy === "mes")
          return a.mes.localeCompare(b.mes, "pt-BR") * direction;
        if (tableSortBy === "tipo")
          return a.tipo.localeCompare(b.tipo, "pt-BR") * direction;
        if (tableSortBy === "categoria")
          return (
            (a.categoria_nome || "").localeCompare(
              b.categoria_nome || "",
              "pt-BR",
            ) * direction
          );
        if (tableSortBy === "banco")
          return (
            (a.banco_nome || "").localeCompare(b.banco_nome || "", "pt-BR") *
            direction
          );
        if (tableSortBy === "situacao")
          return a.situacao.localeCompare(b.situacao, "pt-BR") * direction;
        return (Number(a.valor) - Number(b.valor)) * direction;
      })
      .slice(0, 12);
  }, [filteredTransacoes, tableSortBy, tableSortDirection]);

  const hasSingleTimelineMonth = timeline.length === 1;
  const singleMonthDonutData = hasSingleTimelineMonth
    ? [
        {
          indicador: "Receita",
          valor: timeline[0].receitas,
          fill: chartColors.receitas,
        },
        {
          indicador: "Despesa",
          valor: timeline[0].despesas,
          fill: chartColors.despesas,
        },
      ]
    : [];

  const singleMonthSaldo = hasSingleTimelineMonth ? timeline[0].saldo : 0;
  const singleMonthTotal = hasSingleTimelineMonth
    ? timeline[0].receitas + timeline[0].despesas
    : 0;
  const donutInnerRadius = isMobile ? 44 : 55;
  const donutOuterRadius = isMobile ? 70 : 88;
  const tooltipContentStyle = {
    backgroundColor: "rgb(var(--app-bg-surface))",
    border: "1px solid rgb(var(--app-border-default))",
    borderRadius: 8,
    color: "rgb(var(--app-text-primary))",
  };
  const tooltipLabelStyle = {
    color: "rgb(var(--app-text-secondary))",
  };
  const tooltipItemStyle = {
    color: "rgb(var(--app-text-primary))",
  };
  const tooltipCursor = {
    fill: "rgb(var(--app-neutral-300) / 0.24)",
  };
  const receitaPercent =
    singleMonthTotal > 0
      ? Math.round((timeline[0].receitas / singleMonthTotal) * 100)
      : 0;
  const despesaPercent =
    singleMonthTotal > 0
      ? Math.round((timeline[0].despesas / singleMonthTotal) * 100)
      : 0;
  const renderDonutPercentLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
  }: any) => {
    const safePercent = Number(percent || 0);
    if (safePercent <= 0) return null;

    const centerX = Number(cx);
    const centerY = Number(cy);
    const radius = Number(outerRadius) + 16;
    const angle = (-Number(midAngle) * Math.PI) / 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const labelColor =
      name === "Receita" ? chartColors.receitas : chartColors.despesas;

    return (
      <text
        x={x}
        y={y}
        fill={labelColor}
        textAnchor={x >= centerX ? "start" : "end"}
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
      >
        {`${Math.round(safePercent * 100)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            <BarChart3 size={32} className="text-blue-600" />
            Dashboard Executivo
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Visão consolidada de desempenho financeiro com indicadores e
            análises.
          </p>
        </PageContainer>

        <div className="filter-panel-surface">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
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
                  label="Mês/Ano"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={filterMesAno}
                  onChange={(e) => setFilterMesAno(e.target.value)}
                  title="Mês/Ano específico"
                  InputLabelProps={{ shrink: true }}
                />
              </div>

              <div>
                <TextField
                  select
                  label="Ano"
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
                  label="Tipo"
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
                  <MenuItem value="DESPESA">Despesa</MenuItem>
                  <MenuItem value="RECEITA">Receita</MenuItem>
                </TextField>
              </div>

              <div>
                <TextField
                  select
                  label="Situação"
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
                  <MenuItem value="PAGO">Pago</MenuItem>
                  <MenuItem value="PENDENTE">Pendente</MenuItem>
                </TextField>
              </div>

              <div>
                <TextField
                  select
                  label="Banco"
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
                  label="Categoria"
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
                  <MenuItem value="TODOS">Todos</MenuItem>
                  {sortedCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.nome}
                    </MenuItem>
                  ))}
                </TextField>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMesAno("");
                    setFilterAno(currentYear);
                    setFilterTipo("TODOS");
                    setFilterSituacao("TODOS");
                    setFilterCategoria("TODOS");
                    setFilterBanco("TODOS");
                    setPeriodMonths(12);
                  }}
                  className="app-button-outline-danger inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition"
                >
                  <Icon path={mdiBroom} size={0.75} />
                  Limpar filtros
                </button>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="dashboard-summary-card-success p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Receita</p>
                <p className="text-2xl font-bold text-green-600">
                  {currency(summaryCards.total_receita)}
                </p>
              </div>
              <ArrowLeftRight size={30} className="text-green-500" />
            </div>
          </div>

          <div className="dashboard-summary-card-error p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Total Despesa</p>
                <p className="text-2xl font-bold text-red-600">
                  {currency(summaryCards.total_despesa)}
                </p>
              </div>
              <ArrowLeftRight size={30} className="text-red-500" />
            </div>
          </div>

          <div
            className={`p-6 ${
              summaryCards.total_liquido >= 0
                ? "dashboard-summary-card-info"
                : "dashboard-summary-card-error"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    summaryCards.total_liquido >= 0
                      ? "text-blue-700"
                      : "text-red-700"
                  }`}
                >
                  Total Líquido
                </p>
                <p
                  className={`text-2xl font-bold ${
                    summaryCards.total_liquido >= 0
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {currency(summaryCards.total_liquido)}
                </p>
              </div>
              <DollarSign
                size={30}
                className={
                  summaryCards.total_liquido >= 0
                    ? "text-blue-500"
                    : "text-red-500"
                }
              />
            </div>
          </div>
        </div>

        <div className="app-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Comparativo: Pago vs Provisão
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis
                  hide
                  domain={[
                    (dataMin: number) =>
                      dataMin >= 0 ? 0 : Math.floor(dataMin * 1.2),
                    (dataMax: number) =>
                      dataMax <= 0 ? 0 : Math.ceil(dataMax * 1.2),
                  ]}
                />
                <Tooltip
                  formatter={(v, name) => (
                    <span
                      style={{
                        color: getTooltipSeriesColor(String(name)),
                        fontWeight: 700,
                      }}
                    >
                      {currency(Number(v || 0))}
                    </span>
                  )}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  cursor={tooltipCursor}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="Pago"
                  fill={chartColors.pago}
                  radius={[6, 6, 0, 0]}
                >
                  {!isMobile && (
                    <LabelList
                      dataKey="Pago"
                      position="top"
                      formatter={(value: any) => currency(Number(value))}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        fill: chartColors.pago,
                      }}
                    />
                  )}
                </Bar>
                <Bar
                  dataKey="Provisao"
                  name="Provisão"
                  fill={chartColors.pendente}
                  radius={[6, 6, 0, 0]}
                >
                  {!isMobile && (
                    <LabelList
                      dataKey="Provisao"
                      position="top"
                      formatter={(value: any) => currency(Number(value))}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        fill: chartColors.pendente,
                      }}
                    />
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="app-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              {hasSingleTimelineMonth
                ? "Resumo Mensal"
                : "Evolução no Tempo e Saldo (12 meses)"}
            </h3>
            <div className="h-[520px] sm:h-96">
              {hasSingleTimelineMonth ? (
                <div className="grid h-full grid-cols-1 gap-4 lg:auto-rows-fr lg:grid-cols-2">
                  <div className="h-full">
                    <div className="dashboard-summary-card-neutral flex h-full flex-col p-3">
                      <div className="h-[70%]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={singleMonthDonutData}
                              dataKey="valor"
                              nameKey="indicador"
                              cx="50%"
                              cy="50%"
                              innerRadius={donutInnerRadius}
                              outerRadius={donutOuterRadius}
                              paddingAngle={3}
                              labelLine={false}
                              label={
                                isMobile ? false : renderDonutPercentLabel
                              }
                            >
                              {singleMonthDonutData.map((entry) => (
                                <Cell key={entry.indicador} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v, name) => {
                                const total =
                                  (timeline[0]?.receitas || 0) +
                                  (timeline[0]?.despesas || 0);
                                const value = Number(v || 0);
                                const percent =
                                  total > 0 ? (value / total) * 100 : 0;
                                return (
                                  <span
                                    style={{
                                      color: getTooltipSeriesColor(String(name)),
                                      fontWeight: 700,
                                    }}
                                  >
                                    {`${currency(value)} (${Math.round(percent)}%)`}
                                  </span>
                                );
                              }}
                              contentStyle={tooltipContentStyle}
                              labelStyle={tooltipLabelStyle}
                              itemStyle={tooltipItemStyle}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 font-medium text-gray-700">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: chartColors.receitas }}
                            />
                            Receita
                          </span>
                          <span className="inline-block min-w-[145px] text-right tabular-nums sm:min-w-[170px]">
                            <span style={{ color: chartColors.receitas }}>
                              {currency(timeline[0].receitas)}
                            </span>{" "}
                            <span
                              className="font-bold"
                              style={{ color: chartColors.receitas }}
                            >
                              ({receitaPercent}%)
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 font-medium text-gray-700">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: chartColors.despesas }}
                            />
                            Despesa
                          </span>
                          <span className="inline-block min-w-[145px] text-right tabular-nums sm:min-w-[170px]">
                            <span style={{ color: chartColors.despesas }}>
                              {currency(timeline[0].despesas)}
                            </span>{" "}
                            <span
                              className="font-bold"
                              style={{ color: chartColors.despesas }}
                            >
                              ({despesaPercent}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-full">
                    <div
                      className={`flex h-full items-center justify-center p-3 ${
                        singleMonthSaldo >= 0
                          ? "dashboard-summary-card-info"
                          : "dashboard-summary-card-error"
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700">
                          Líquido
                        </p>
                        <p
                          className={`mt-2 text-3xl font-bold ${
                            singleMonthSaldo >= 0
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {currency(singleMonthSaldo)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeline}
                    margin={{ top: 30, right: 28, left: 20, bottom: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 10 }}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v, name) => (
                        <span
                          style={{
                            color: getTooltipSeriesColor(String(name)),
                            fontWeight: 700,
                          }}
                        >
                          {currency(Number(v || 0))}
                        </span>
                      )}
                      contentStyle={tooltipContentStyle}
                      labelStyle={tooltipLabelStyle}
                      itemStyle={tooltipItemStyle}
                      cursor={tooltipCursor}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="receitas"
                      stroke={chartColors.receitas}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="despesas"
                      stroke={chartColors.despesas}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke={chartColors.saldo}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    >
                      {!isMobile && (
                        <LabelList
                          dataKey="saldo"
                          position="top"
                          formatter={(value: any) => currency(Number(value))}
                          style={{
                            fontSize: 8,
                            fill: chartColors.saldo,
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="app-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Comparativo por Categoria (Barras)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis
                    hide
                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip
                    formatter={(v, _name, item) => {
                      const itemColor =
                        typeof (item as { color?: unknown })?.color === "string"
                          ? ((item as { color?: string }).color as string)
                          : chartColors.saldo;

                      return [
                        <span
                          style={{
                            color: itemColor,
                            fontWeight: 700,
                          }}
                        >
                          {currency(Number(v || 0))}
                        </span>,
                        "Total",
                      ];
                    }}
                    labelFormatter={(label) => `Categoria: ${label}`}
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={tooltipCursor}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {byCategory.map((_, index) => {
                      const colors = [
                        chartColors.pieA,
                        chartColors.pieB,
                        chartColors.pieC,
                        chartColors.pieD,
                        chartColors.pieE,
                      ];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                    {!isMobile && (
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(value: any) => currency(Number(value))}
                        style={{ fontSize: 10, fontWeight: 600 }}
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="app-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Dados Detalhados
            </h3>
            <span className="text-xs text-gray-500">
              Registros filtrados exibidos: {detailedRows.length}
            </span>
          </div>

          <div className="space-y-2 px-2 sm:px-0 md:hidden">
            {detailedRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                Nenhum registro encontrado com os filtros atuais.
              </div>
            ) : (
              detailedRows.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {t.descricao_nome || "Sem descrição"}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">{t.mes}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                        t.tipo === "RECEITA"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {tipoLabel[t.tipo]}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Categoria: </span>
                      {t.categoria_nome || "-"}
                    </p>
                    <p>
                      <span className="font-medium">Banco: </span>
                      {t.banco_nome || "-"}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                        t.situacao === "PAGO"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {situacaoLabel[t.situacao]}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {currency(Number(t.valor))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[900px] w-full divide-y divide-gray-200 text-xs">
              <thead className="app-table-head">
                <tr>
                  <th className="app-table-head-cell">
                    <button
                      type="button"
                      onClick={() => handleTableSort("mes")}
                      className="inline-flex items-center gap-1"
                    >
                      Mês
                      {tableSortBy === "mes" && tableSortDirection === "asc" ? (
                        <ArrowUpNarrowWide size={14} />
                      ) : tableSortBy === "mes" ? (
                        <ArrowDownWideNarrow size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="app-table-head-cell">
                    <button
                      type="button"
                      onClick={() => handleTableSort("tipo")}
                      className="inline-flex items-center gap-1"
                    >
                      Tipo
                      {tableSortBy === "tipo" &&
                      tableSortDirection === "asc" ? (
                        <ArrowUpNarrowWide size={14} />
                      ) : tableSortBy === "tipo" ? (
                        <ArrowDownWideNarrow size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="app-table-head-cell">
                    <button
                      type="button"
                      onClick={() => handleTableSort("categoria")}
                      className="inline-flex items-center gap-1"
                    >
                      Categoria
                      {tableSortBy === "categoria" &&
                      tableSortDirection === "asc" ? (
                        <ArrowUpNarrowWide size={14} />
                      ) : tableSortBy === "categoria" ? (
                        <ArrowDownWideNarrow size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="app-table-head-cell">
                    Descrição
                  </th>
                  <th className="app-table-head-cell">
                    <button
                      type="button"
                      onClick={() => handleTableSort("banco")}
                      className="inline-flex items-center gap-1"
                    >
                      Banco
                      {tableSortBy === "banco" &&
                      tableSortDirection === "asc" ? (
                        <ArrowUpNarrowWide size={14} />
                      ) : tableSortBy === "banco" ? (
                        <ArrowDownWideNarrow size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="app-table-head-cell">
                    <button
                      type="button"
                      onClick={() => handleTableSort("situacao")}
                      className="inline-flex items-center gap-1"
                    >
                      Situação
                      {tableSortBy === "situacao" &&
                      tableSortDirection === "asc" ? (
                        <ArrowUpNarrowWide size={14} />
                      ) : tableSortBy === "situacao" ? (
                        <ArrowDownWideNarrow size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="app-table-head-cell-right">
                    <button
                      type="button"
                      onClick={() => handleTableSort("valor")}
                      className="inline-flex items-center gap-1"
                    >
                      Valor
                      {tableSortBy === "valor" &&
                      tableSortDirection === "asc" ? (
                        <ArrowUpNarrowWide size={14} />
                      ) : tableSortBy === "valor" ? (
                        <ArrowDownWideNarrow size={14} />
                      ) : null}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {detailedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-8 text-center text-xs text-gray-500"
                    >
                      Nenhum registro encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  detailedRows.map((t) => (
                    <tr key={t.id} className="app-table-row">
                      <td className="px-3 py-2 text-xs text-gray-700">
                        {t.mes}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                            t.tipo === "RECEITA"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {tipoLabel[t.tipo]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        {t.categoria_nome || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        {t.descricao_nome || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        {t.banco_nome || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                            t.situacao === "PAGO"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {situacaoLabel[t.situacao]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                        {currency(Number(t.valor))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}



