"use client";

import { useEffect, useMemo, useState } from "react";
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, PieChart as PieIcon } from "lucide-react";
import { MenuItem, TextField } from "@mui/material";
import {
  Cell,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import FeedbackAlert from "@/components/FeedbackAlert";
import PageHeader from "@/components/PageHeader";
import { bankService } from "@/services/bankService";
import { investimentoDashboardService } from "@/services/investimentoService";
import { Bank } from "@/types/bank";
import { InvestimentoDashboardResponse } from "@/types/investimento";
import { formatCurrency, formatMonthShort, formatMonthYearLabel, previousMonthKey } from "@/utils/format";
import StatCard, { StatCardComparison } from "@/components/StatCard";
import ChartCardHeader from "@/components/ChartCardHeader";
import ActiveBadge from "@/components/ActiveBadge";
import FilterBar from "@/components/FilterBar";
import { FilterChip } from "@/components/FilterChips";
import MonthSwitcher from "@/components/MonthSwitcher";
import { parsePositiveInt, useUrlFilterSync } from "@/utils/useUrlFilterSync";

type AtivoFilter = "TODOS" | "ATIVOS" | "INATIVOS";

const DEFAULT_ATIVO_FILTER: AtivoFilter = "ATIVOS";

const chartColors = {
  aporte: "rgb(var(--app-chart-pendente))",
  resgate: "rgb(var(--app-chart-despesa))",
  rendimento: "rgb(var(--app-chart-pago))",
  resultado: "rgb(var(--app-chart-saldo))",
};

const toIsoDate = (date: Date): string => {
  const timezoneOffsetInMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetInMs).toISOString().slice(0, 10);
};

export default function InvestimentosDashboardPage() {
  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  
  // Filtros inicializados com o presente
  const [filterAtivo, setFilterAtivo] = useState<AtivoFilter>(DEFAULT_ATIVO_FILTER);
  const [filterMesAno, setFilterMesAno] = useState(currentMonthKey);
  const [filterAno, setFilterAno] = useState<string>(currentYearStr);
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");

  // Filtros na URL: permite recarregar, compartilhar e voltar ao mesmo estado
  const filtersReady = useUrlFilterSync(
    (params) => {
      const mes = params.get("mes");
      if (mes === "todos") setFilterMesAno("");
      else if (mes && /^\d{4}-\d{2}$/.test(mes)) setFilterMesAno(mes);
      const ano = params.get("ano");
      if (ano && /^\d{4}$/.test(ano)) setFilterAno(ano);
      else if (mes && /^\d{4}-\d{2}$/.test(mes)) setFilterAno(mes.slice(0, 4));
      const status = params.get("status");
      if (status === "ATIVOS" || status === "INATIVOS" || status === "TODOS") setFilterAtivo(status);
      const banco = parsePositiveInt(params.get("banco"));
      if (banco) setFilterBanco(banco);
    },
    {
      mes: filterMesAno === currentMonthKey ? null : filterMesAno || "todos",
      ano: filterAno === currentYearStr ? null : filterAno,
      status: filterAtivo === DEFAULT_ATIVO_FILTER ? null : filterAtivo,
      banco: filterBanco === "TODOS" ? null : String(filterBanco),
    },
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  
  const [dashboard, setDashboard] = useState<InvestimentoDashboardResponse>({
    cards: { aporte: 0, resgate: 0, rendimentos: 0, liquido: 0 },
    carteira: { total_ativos: 0, saldo_total: 0, ativos: [] },
    timeline: [],
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const response = await bankService.getAll({ page: 1, limit: 999 });
        setBanks(response.data || []);
      } catch (error) { console.error(error); }
    };
    loadBanks();
  }, []);

  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const years = await investimentoDashboardService.getAvailableYears({});
        setAvailableYears(years);
      } catch (error) { console.error(error); }
    };
    loadAvailableYears();
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        // ITEM 3: Busca sempre o ano completo para a Evolução Histórica (independente do filtro de mês)
        const yearToFetch = filterAno === "TODOS" ? now.getFullYear() : Number(filterAno);
        const data_de = toIsoDate(new Date(yearToFetch, 0, 1));
        const data_ate = toIsoDate(new Date(yearToFetch, 11, 31));

        const response = await investimentoDashboardService.get({
          banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
          ativo: filterAtivo === "ATIVOS" ? true : filterAtivo === "INATIVOS" ? false : undefined,
          data_de,
          data_ate,
        });
        setDashboard(response);

        // Sincroniza o filterMesAno para o novo ano se necessário
        if (filterAno !== "TODOS" && filterMesAno) {
          const [currYear, currMonth] = filterMesAno.split("-");
          if (currYear !== filterAno) {
            setFilterMesAno(`${filterAno}-${currMonth}`);
          }
        }
      } catch (error) {
        setFeedback({ type: "error", message: "Erro ao carregar dados." });
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [filtersReady, filterAtivo, filterAno, filterBanco]);

  const handleClearFilters = () => {
    setFilterMesAno(currentMonthKey);
    setFilterAno(currentYearStr);
    setFilterAtivo(DEFAULT_ATIVO_FILTER);
    setFilterBanco("TODOS");
  };

  // O histórico é carregado por ano: ao navegar para um mês de outro ano, o ano acompanha
  const handleMonthChange = (value: string) => {
    setFilterMesAno(value);
    if (value) setFilterAno(value.slice(0, 4));
  };

  const filterChips: FilterChip[] = [];
  if (filterAno !== currentYearStr && !filterMesAno) {
    filterChips.push({ key: "ano", label: `Ano: ${filterAno}`, onRemove: () => setFilterAno(currentYearStr) });
  }
  if (filterAtivo !== DEFAULT_ATIVO_FILTER) {
    filterChips.push({
      key: "status",
      label: `Status: ${filterAtivo === "TODOS" ? "Todos" : "Inativos"}`,
      onRemove: () => setFilterAtivo(DEFAULT_ATIVO_FILTER),
    });
  }
  if (filterBanco !== "TODOS") {
    const nome = banks.find((bank) => bank.id === filterBanco)?.nome ?? `#${filterBanco}`;
    filterChips.push({ key: "banco", label: `Banco: ${nome}`, onRemove: () => setFilterBanco("TODOS") });
  }

  const advancedCount =
    (filterAno !== currentYearStr && !filterMesAno ? 1 : 0) +
    (filterAtivo !== DEFAULT_ATIVO_FILTER ? 1 : 0) +
    (filterBanco !== "TODOS" ? 1 : 0);

  // Dados do Mês Selecionado para Donut e Cards
  const selectedMonthPoint = useMemo(() => {
    return dashboard.timeline.find(p => p.month_key === filterMesAno) || null;
  }, [dashboard.timeline, filterMesAno]);

  // Dados consolidados do ano para quando nenhum mês específico está em foco
  const yearSummary = useMemo(() => {
    return dashboard.timeline.reduce((acc, point) => ({
      aporte: acc.aporte + point.aporte,
      resgate: acc.resgate + point.resgate,
      rendimentos: acc.rendimentos + point.rendimentos,
    }), { aporte: 0, resgate: 0, rendimentos: 0 });
  }, [dashboard.timeline]);

  // Ponto do mês anterior ao selecionado, para a variação dos cards (o histórico é carregado por ano)
  const previousMonthPoint = useMemo(() => {
    if (!selectedMonthPoint || !filterMesAno) return null;
    const prevKey = previousMonthKey(filterMesAno);
    return dashboard.timeline.find((p) => p.month_key === prevKey) || null;
  }, [dashboard.timeline, selectedMonthPoint, filterMesAno]);

  const compareWithPrevious = (
    key: "aporte" | "resgate" | "rendimentos" | "saldo",
    higherIsBetter?: boolean,
  ): StatCardComparison | undefined =>
    previousMonthPoint
      ? { previous: previousMonthPoint[key], label: formatMonthShort(previousMonthPoint.month_key), higherIsBetter }
      : undefined;

  // Se houver mês selecionado, os cards e donut usam esse ponto. Caso contrário, o consolidado do ano.
  const displayPoint = useMemo(() => {
    if (selectedMonthPoint) return selectedMonthPoint;
    
    // Se não há mês selecionado, retorna o consolidado do ano para Aporte/Resgate/Rendimentos
    // Mas o Saldo (que é um valor de posição) usamos o do último ponto disponível ou da carteira
    return {
      ...yearSummary,
      saldo: dashboard.carteira.saldo_total,
      month_key: null
    };
  }, [selectedMonthPoint, yearSummary, dashboard.carteira.saldo_total]);

  const monthAnalysisData = useMemo(() => {
    if (!displayPoint) return [];
    const data = [
      { name: "Aporte", value: displayPoint.aporte, fill: chartColors.aporte },
      { name: "Resgate", value: displayPoint.resgate, fill: chartColors.resgate },
      { name: "Rendimento", value: displayPoint.rendimentos, fill: chartColors.rendimento },
    ].filter(d => d.value !== 0);

    // Se estiver tudo zerado, retorna um array vazio para o PieChart lidar
    return data;
  }, [displayPoint]);

  const monthLabel = useMemo(() => {
    if (displayPoint?.month_key) {
      return formatMonthYearLabel(displayPoint.month_key);
    }
    return formatMonthYearLabel(filterMesAno);
  }, [displayPoint, filterMesAno]);

  const carteiraTotalLabel = useMemo(() => {
    const total = dashboard.carteira.total_ativos;

    if (filterAtivo === "INATIVOS") {
      return `${total} ${total === 1 ? "inativo" : "inativos"}`;
    }

    if (filterAtivo === "TODOS") {
      return `${total} ${total === 1 ? "ativo cadastrado" : "ativos cadastrados"}`;
    }

    return `${total} ${total === 1 ? "ativo" : "ativos"}`;
  }, [dashboard.carteira.total_ativos, filterAtivo]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/95">
          {label && <p className="mb-2 text-xs font-medium text-[rgb(var(--app-text-muted))]">{label}</p>}
          <div className="space-y-2">
            {payload.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload?.fill || item.color || chartColors.resultado }} />
                  <span className="text-xs text-[rgb(var(--app-text-secondary))]">{item.name}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums" style={{ color: item.payload?.fill || item.color || chartColors.resultado }}>
                  {formatCurrency(item.value || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="app-page py-4 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 w-full animate-pulse rounded-lg bg-gray-200" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageHeader
          title="Investimentos"
          description="Análise consolidada da sua carteira de ativos."
        />

        <FilterBar
          label="Filtros da carteira"
          leading={<MonthSwitcher value={filterMesAno} onChange={handleMonthChange} allowAll />}
          advancedCount={advancedCount}
          chips={filterChips}
          onClearAll={handleClearFilters}
          advanced={
            <>
              <TextField select label="Ano" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterAno} onChange={(e) => setFilterAno(e.target.value)}>
                {availableYears.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
              </TextField>
              <TextField select label="Status" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterAtivo} onChange={(e) => setFilterAtivo(e.target.value as AtivoFilter)}>
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="ATIVOS">Ativos</MenuItem>
                <MenuItem value="INATIVOS">Inativos</MenuItem>
              </TextField>
              <TextField select label="Banco" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterBanco} onChange={(e) => setFilterBanco(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value))}>
                <MenuItem value="TODOS">Todos</MenuItem>
                {[...banks].sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR")).map((bank) => <MenuItem key={bank.id} value={bank.id}>{bank.nome}</MenuItem>)}
              </TextField>
            </>
          }
        />

        {/* Cards Premium com Ícone na Direita e Cores Sincronizadas */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Aporte" value={displayPoint?.aporte || 0} icon={ArrowUpRight} tone="warning" comparison={compareWithPrevious("aporte", true)} />
          <StatCard title="Resgate" value={displayPoint?.resgate || 0} icon={ArrowDownRight} tone="error" comparison={compareWithPrevious("resgate")} />
          <StatCard title="Rendimentos" value={displayPoint?.rendimentos || 0} icon={TrendingUp} tone="success" comparison={compareWithPrevious("rendimentos", true)} />
          <StatCard title="Saldo Atual" value={displayPoint?.saldo || 0} icon={DollarSign} tone="info" comparison={compareWithPrevious("saldo", true)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Movimentações Mensais */}
          <div className="app-surface p-6 overflow-hidden min-h-[400px] flex flex-col">
            <ChartCardHeader
              title="Movimentações Mensais"
              subtitle={`Ano ${filterAno === "TODOS" ? currentYearStr : filterAno}`}
              icon={<Activity size={20} />}
              iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
            />
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {['aporte', 'resgate', 'rendimento'].map(key => (
                      <linearGradient key={key} id={`color-inv-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors[key as keyof typeof chartColors]} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={chartColors[key as keyof typeof chartColors]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--app-border-default), 0.1)" />
                  <XAxis 
                    dataKey="month_label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "rgb(var(--app-text-secondary))", fontWeight: 500 }} 
                    interval={0} 
                    minTickGap={0}
                    padding={{ left: 10, right: 10 }}
                    tickFormatter={(value) => value.split('/')[0]} 
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingBottom: '24px' }} />
                  <Area type="monotone" dataKey="aporte" name="Aporte" stroke={chartColors.aporte} strokeWidth={4} fillOpacity={1} fill="url(#color-inv-aporte)" animationDuration={1500} />
                  <Area type="monotone" dataKey="resgate" name="Resgate" stroke={chartColors.resgate} strokeWidth={4} fillOpacity={1} fill="url(#color-inv-resgate)" animationDuration={1500} />
                  <Area type="monotone" dataKey="rendimentos" name="Rendimento" stroke={chartColors.rendimento} strokeWidth={4} fillOpacity={1} fill="url(#color-inv-rendimento)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evolução do Patrimônio */}
          <div className="app-surface p-6 overflow-hidden min-h-[400px] flex flex-col">
            <ChartCardHeader
              title="Evolução do Patrimônio"
              subtitle={`Ano ${filterAno === "TODOS" ? currentYearStr : filterAno}`}
              icon={<TrendingUp size={20} />}
              iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="color-inv-saldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.resultado} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={chartColors.resultado} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--app-border-default), 0.1)" />
                  <XAxis 
                    dataKey="month_label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "rgb(var(--app-text-secondary))", fontWeight: 500 }} 
                    interval={0} 
                    minTickGap={0}
                    padding={{ left: 10, right: 10 }}
                    tickFormatter={(value) => value.split('/')[0]} 
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="saldo" name="Saldo" stroke={chartColors.resultado} strokeWidth={4} fillOpacity={1} fill="url(#color-inv-saldo)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Análise de Mês (ITEM 4: TOTALMENTE ESTÁTICA) */}
          <div className="app-surface p-6 overflow-hidden min-h-[480px] flex flex-col lg:col-span-2">
            <ChartCardHeader
              title={`Análise de ${monthLabel}`}
              subtitle="Composição do período"
              icon={<PieIcon size={20} />}
              iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
            />
            
            <div className="flex-1 w-full relative flex flex-col justify-center">
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={monthAnalysisData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="70%" 
                      outerRadius="90%" 
                      paddingAngle={8} 
                      cornerRadius={10} 
                      dataKey="value" 
                      stroke="none" 
                      animationDuration={1200}
                    >
                      {monthAnalysisData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} style={{ outline: 'none' }} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="mb-1 block text-xs font-medium text-[rgb(var(--app-text-muted))]">Saldo</span>
                  <span className="text-2xl font-bold tabular-nums tracking-tighter text-blue-600 dark:text-blue-400 block">
                    {formatCurrency(displayPoint?.saldo || 0)}
                  </span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-2xl mx-auto">
                {monthAnalysisData.length > 0 ? monthAnalysisData.map((d, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-slate-800/40 rounded-lg p-4 border border-gray-100 dark:border-slate-700/30 flex flex-col items-center text-center shadow-sm">
                    <span className="mb-1 text-xs font-medium" style={{ color: d.fill }}>{d.name}</span>
                    <span className="text-base font-semibold tabular-nums" style={{ color: d.fill }}>{formatCurrency(d.value)}</span>
                  </div>
                )) : (
                  <div className="col-span-3 py-4 text-center text-sm text-[rgb(var(--app-text-muted))]">Sem movimentações no mês</div>
                )}
              </div>
            </div>
          </div>

          <div className="app-surface p-6 lg:col-span-1 overflow-hidden">
            <ChartCardHeader title="Carteira Atual" />
            
            <div className="mb-6 rounded-lg bg-blue-50/50 p-4 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
               <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">Saldo Total</p>
               <p className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrency(dashboard.carteira.saldo_total)}</p>
               <p className="mt-1 text-xs text-[rgb(var(--app-text-muted))]">{carteiraTotalLabel}</p>
            </div>

            <div className="overflow-y-auto max-h-[300px] custom-scrollbar">
              <div className="space-y-3 pr-2">
                {dashboard.carteira.ativos.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 text-xs">Nenhum ativo encontrado.</p>
                ) : (
                  dashboard.carteira.ativos.map((item) => (
                    <div key={item.id} className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-700/30 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-[rgb(var(--app-text-primary))]" title={item.nome}>{item.nome}</span>
                        <ActiveBadge ativo={item.ativo} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-slate-400 truncate max-w-[100px]">{item.banco_nome || "Sem Banco"}</span>
                        <span className="font-semibold tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(Number(item.saldo_atual || 0))}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
