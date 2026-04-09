"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { MenuItem, TextField } from "@mui/material";
import {
  Cell,
  CartesianGrid,
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
import FeedbackAlert from "@/components/FeedbackAlert";
import PageContainer from "@/components/PageContainer";
import { bankService } from "@/services/bankService";
import { investimentoDashboardService } from "@/services/investimentoService";
import { Bank } from "@/types/bank";
import { InvestimentoDashboardResponse } from "@/types/investimento";

type AtivoFilter = "TODOS" | "ATIVOS" | "INATIVOS";

const chartColors = {
  aporte: "rgb(var(--app-chart-pendente))",
  resgate: "rgb(var(--app-chart-despesa))",
  rendimento: "rgb(var(--app-chart-pago))",
  resultado: "rgb(var(--app-chart-saldo))",
};

const formatCurrencyBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const formatMonthYearLabel = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return value;
  const [, year, month] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const toIsoDate = (date: Date): string => {
  const timezoneOffsetInMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetInMs).toISOString().slice(0, 10);
};

const getDateRangeByFilters = ({
  filterMesAno,
  filterAno,
}: {
  filterMesAno: string;
  filterAno: string;
}): { data_de?: string; data_ate?: string } => {
  if (/^\d{4}-\d{2}$/.test(filterMesAno)) {
    const [yearValue, monthValue] = filterMesAno.split("-").map(Number);
    const startDate = new Date(yearValue, monthValue - 1, 1);
    const endDate = new Date(yearValue, monthValue, 0);
    return {
      data_de: toIsoDate(startDate),
      data_ate: toIsoDate(endDate),
    };
  }

  if (filterAno !== "TODOS") {
    const selectedYear = Number(filterAno);
    if (!Number.isNaN(selectedYear)) {
      return {
        data_de: toIsoDate(new Date(selectedYear, 0, 1)),
        data_ate: toIsoDate(new Date(selectedYear, 11, 31)),
      };
    }
  }

  return {};
};

export default function InvestimentosDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [filterAtivo, setFilterAtivo] = useState<AtivoFilter>("TODOS");
  const [filterMesAno, setFilterMesAno] = useState("");
  const [filterAno, setFilterAno] = useState<string>("TODOS");
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [dashboard, setDashboard] = useState<InvestimentoDashboardResponse>({
    cards: {
      aporte: 0,
      resgate: 0,
      rendimentos: 0,
      liquido: 0,
    },
    carteira: {
      total_ativos: 0,
      saldo_total: 0,
      ativos: [],
    },
    timeline: [],
  });

  const sortedBanks = useMemo(
    () => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [banks],
  );

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

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const response = await bankService.getAll({ page: 1, limit: 999 });
        setBanks(response.data || []);
      } catch (error) {
        console.error("Erro ao carregar bancos:", error);
      }
    };

    loadBanks();
  }, []);

  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const years = await investimentoDashboardService.getAvailableYears({
          banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
          ativo:
            filterAtivo === "ATIVOS"
              ? true
              : filterAtivo === "INATIVOS"
                ? false
                : undefined,
        });
        setAvailableYears(years);

        if (filterAno !== "TODOS" && !years.includes(filterAno)) {
          setFilterAno("TODOS");
        }
      } catch (error) {
        console.error("Erro ao carregar anos disponíveis:", error);
        setAvailableYears([]);
      }
    };

    loadAvailableYears();
  }, [filterBanco, filterAtivo, filterAno]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const periodRange = getDateRangeByFilters({
          filterMesAno,
          filterAno,
        });
        const response = await investimentoDashboardService.get({
          banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
          ativo:
            filterAtivo === "ATIVOS"
              ? true
              : filterAtivo === "INATIVOS"
                ? false
                : undefined,
          data_de: periodRange.data_de,
          data_ate: periodRange.data_ate,
        });

        setDashboard(response);
      } catch (error) {
        console.error("Erro ao carregar dashboard de investimentos:", error);
        setFeedback({
          type: "error",
          message: "Não foi possível carregar o dashboard de investimentos.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [filterAtivo, filterMesAno, filterAno, filterBanco]);

  const handleClearFilters = () => {
    setFilterMesAno("");
    setFilterAno("TODOS");
    setFilterAtivo("TODOS");
    setFilterBanco("TODOS");
  };

  const timelineTitle = filterMesAno
    ? `Evolução no Tempo e Resultado líquido (${formatMonthYearLabel(filterMesAno)})`
    : filterAno !== "TODOS"
      ? `Evolução no Tempo e Resultado líquido (Ano ${filterAno})`
      : "Evolução no Tempo e Resultado líquido (12 meses)";

  const timelineWithResultadoBands = useMemo(
    () =>
      dashboard.timeline.map((point) => ({
        ...point,
        resultado_positivo: point.saldo >= 0 ? point.saldo : null,
        resultado_negativo: point.saldo < 0 ? point.saldo : null,
      })),
    [dashboard.timeline],
  );

  const hasSingleTimelineMonth = dashboard.timeline.length === 1;
  const singleMonthPoint = hasSingleTimelineMonth ? dashboard.timeline[0] : null;
  const singleMonthDonutData = singleMonthPoint
    ? [
        {
          indicador: "Aporte",
          valor: singleMonthPoint.aporte,
          fill: chartColors.aporte,
        },
        {
          indicador: "Resgate",
          valor: singleMonthPoint.resgate,
          fill: chartColors.resgate,
        },
        {
          indicador: "Rendimentos",
          valor: singleMonthPoint.rendimentos,
          fill: chartColors.rendimento,
        },
      ]
    : [];

  const singleMonthTotal = singleMonthPoint
    ? singleMonthPoint.aporte + singleMonthPoint.resgate + singleMonthPoint.rendimentos
    : 0;
  const aportePercent =
    singleMonthPoint && singleMonthTotal > 0
      ? Math.round((singleMonthPoint.aporte / singleMonthTotal) * 100)
      : 0;
  const resgatePercent =
    singleMonthPoint && singleMonthTotal > 0
      ? Math.round((singleMonthPoint.resgate / singleMonthTotal) * 100)
      : 0;
  const rendimentoPercent =
    singleMonthPoint && singleMonthTotal > 0
      ? Math.round((singleMonthPoint.rendimentos / singleMonthTotal) * 100)
      : 0;

  const donutInnerRadius = isMobile ? 44 : 55;
  const donutOuterRadius = isMobile ? 70 : 88;
  const tooltipContentStyle = {
    backgroundColor: "rgb(var(--app-bg-surface))",
    border: "1px solid rgb(var(--app-border-default))",
    borderRadius: 8,
  };

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
      name === "Aporte"
        ? chartColors.aporte
        : name === "Resgate"
          ? chartColors.resgate
          : chartColors.rendimento;

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
            Dashboard de Investimentos
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Visão consolidada de aportes, resgates, rendimentos e carteira atual.
          </p>
        </PageContainer>

        <div className="filter-panel-surface">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
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

            <TextField
              select
              label="Status"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterAtivo}
              onChange={(e) => setFilterAtivo(e.target.value as AtivoFilter)}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="ATIVOS">Ativos</MenuItem>
              <MenuItem value="INATIVOS">Inativos</MenuItem>
            </TextField>

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
                  e.target.value === "TODOS" ? "TODOS" : Number(e.target.value),
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

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="app-button-outline-danger inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition md:w-auto md:justify-start"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="dashboard-summary-card-warning p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Aporte</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrencyBRL(dashboard.cards.aporte)}
                </p>
              </div>
              <ArrowLeftRight size={30} className="text-amber-500" />
            </div>
          </div>
          <div className="dashboard-summary-card-error p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Resgate</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrencyBRL(dashboard.cards.resgate)}
                </p>
              </div>
              <ArrowLeftRight size={30} className="text-red-500" />
            </div>
          </div>
          <div className="dashboard-summary-card-success p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Rendimentos</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrencyBRL(dashboard.cards.rendimentos)}
                </p>
              </div>
              <TrendingUp size={30} className="text-green-500" />
            </div>
          </div>
          <div
            className={`p-6 ${
              dashboard.cards.liquido >= 0
                ? "dashboard-summary-card-info"
                : "dashboard-summary-card-error"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    dashboard.cards.liquido >= 0 ? "text-blue-700" : "text-red-700"
                  }`}
                >
                  Saldo atual
                </p>
                <p
                  className={`text-2xl font-bold ${
                    dashboard.cards.liquido >= 0 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {formatCurrencyBRL(dashboard.cards.liquido)}
                </p>
              </div>
              <DollarSign
                size={30}
                className={
                  dashboard.cards.liquido >= 0 ? "text-blue-500" : "text-red-500"
                }
              />
            </div>
          </div>
        </div>

        <div className="app-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">{timelineTitle}</h3>
          <div className="h-[520px] sm:h-96">
            {dashboard.timeline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Sem movimentações no período selecionado.
              </div>
            ) : hasSingleTimelineMonth && singleMonthPoint ? (
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
                            label={isMobile ? false : renderDonutPercentLabel}
                          >
                            {singleMonthDonutData.map((entry) => (
                              <Cell key={entry.indicador} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v, name) => {
                              const total =
                                (singleMonthPoint.aporte || 0) +
                                (singleMonthPoint.resgate || 0) +
                                (singleMonthPoint.rendimentos || 0);
                              const value = Number(v || 0);
                              const percent = total > 0 ? (value / total) * 100 : 0;
                              return `${formatCurrencyBRL(value)} (${Math.round(percent)}%)`;
                            }}
                            contentStyle={tooltipContentStyle}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-700">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: chartColors.aporte }}
                          />
                          Aporte
                        </span>
                        <span className="inline-block min-w-[145px] text-right tabular-nums sm:min-w-[170px]">
                          <span style={{ color: chartColors.aporte }}>
                            {formatCurrencyBRL(singleMonthPoint.aporte)}
                          </span>{" "}
                          <span className="font-bold" style={{ color: chartColors.aporte }}>
                            ({aportePercent}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-700">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: chartColors.resgate }}
                          />
                          Resgate
                        </span>
                        <span className="inline-block min-w-[145px] text-right tabular-nums sm:min-w-[170px]">
                          <span style={{ color: chartColors.resgate }}>
                            {formatCurrencyBRL(singleMonthPoint.resgate)}
                          </span>{" "}
                          <span className="font-bold" style={{ color: chartColors.resgate }}>
                            ({resgatePercent}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-700">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: chartColors.rendimento }}
                          />
                          Rendimentos
                        </span>
                        <span className="inline-block min-w-[145px] text-right tabular-nums sm:min-w-[170px]">
                          <span style={{ color: chartColors.rendimento }}>
                            {formatCurrencyBRL(singleMonthPoint.rendimentos)}
                          </span>{" "}
                          <span className="font-bold" style={{ color: chartColors.rendimento }}>
                            ({rendimentoPercent}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-full">
                  <div
                    className={`flex h-full items-center justify-center p-3 ${
                      singleMonthPoint.saldo >= 0
                        ? "dashboard-summary-card-info"
                        : "dashboard-summary-card-error"
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        Resultado líquido
                      </p>
                      <p
                        className={`mt-2 text-3xl font-bold ${
                          singleMonthPoint.saldo >= 0 ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrencyBRL(singleMonthPoint.saldo)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timelineWithResultadoBands}
                  margin={{ top: 30, right: 28, left: 20, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month_label"
                    tick={{ fontSize: 10 }}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => formatCurrencyBRL(Number(value || 0))}
                    contentStyle={tooltipContentStyle}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="aporte"
                    name="Aporte"
                    stroke={chartColors.aporte}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resgate"
                    name="Resgate"
                    stroke={chartColors.resgate}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rendimentos"
                    name="Rendimentos"
                    stroke={chartColors.rendimento}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resultado_positivo"
                    name="Resultado líquido"
                    stroke={chartColors.resultado}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="resultado_negativo"
                    name="Resultado líquido"
                    stroke={chartColors.resgate}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                    legendType="none"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="app-surface p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Carteira Atual</h3>
            <div className="text-xs text-gray-600">
              Ativos: <strong>{dashboard.carteira.total_ativos}</strong> | Saldo
              total: <strong>{formatCurrencyBRL(dashboard.carteira.saldo_total)}</strong>
            </div>
          </div>

          <div className="space-y-2 px-2 sm:px-0 md:hidden">
            {dashboard.carteira.ativos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                Nenhum ativo encontrado para os filtros atuais.
              </div>
            ) : (
              dashboard.carteira.ativos.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.nome}</p>
                      <p className="mt-1 text-xs text-gray-600">
                        Banco: {item.banco_nome || "-"}
                      </p>
                    </div>
                    {item.ativo ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                        Inativo
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Saldo inicial: </span>
                      {formatCurrencyBRL(Number(item.saldo_inicial))}
                    </p>
                    <p>
                      <span className="font-medium">Saldo atual: </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrencyBRL(Number(item.saldo_atual || 0))}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[680px] w-full divide-y divide-gray-200 text-xs">
              <thead className="app-table-head">
                <tr>
                  <th className="app-table-head-cell">Ativo</th>
                  <th className="app-table-head-cell">Banco</th>
                  <th className="app-table-head-cell-right">Saldo Inicial</th>
                  <th className="app-table-head-cell-right">Saldo Atual</th>
                  <th className="app-table-head-cell-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {dashboard.carteira.ativos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-xs text-gray-500"
                    >
                      Nenhum ativo encontrado para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  dashboard.carteira.ativos.map((item) => (
                    <tr key={item.id} className="app-table-row">
                      <td className="px-3 py-2 text-xs text-gray-700">{item.nome}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        {item.banco_nome || "-"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-gray-700">
                        {formatCurrencyBRL(Number(item.saldo_inicial))}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                        {formatCurrencyBRL(Number(item.saldo_atual || 0))}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {item.ativo ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                            Inativo
                          </span>
                        )}
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

