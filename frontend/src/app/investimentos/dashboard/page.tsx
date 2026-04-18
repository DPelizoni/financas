"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, BarChart3, DollarSign, TrendingUp, Filter, ArrowUpRight, ArrowDownRight, Activity, PieChart as PieIcon } from "lucide-react";
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
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
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

export default function InvestimentosDashboardPage() {
  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  
  // Filtros inicializados com o presente
  const [filterAtivo, setFilterAtivo] = useState<AtivoFilter>("TODOS");
  const [filterMesAno, setFilterMesAno] = useState(currentMonthKey);
  const [filterAno, setFilterAno] = useState<string>(currentYearStr);
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [showFilters, setShowFilters] = useState(false);

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
        if (filterAno !== "TODOS") {
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
  }, [filterAtivo, filterAno, filterBanco]);

  const handleClearFilters = () => {
    setFilterMesAno(currentMonthKey);
    setFilterAno(currentYearStr);
    setFilterAtivo("TODOS");
    setFilterBanco("TODOS");
  };

  // Dados do Mês Selecionado para Donut e Cards
  const selectedMonthPoint = useMemo(() => {
    return dashboard.timeline.find(p => p.month_key === filterMesAno) || null;
  }, [dashboard.timeline, filterMesAno]);

  // Se houver mês selecionado, os cards e donut usam esse ponto. Caso contrário, o primeiro da timeline.
  const displayPoint = useMemo(() => {
    if (selectedMonthPoint) return selectedMonthPoint;
    if (dashboard.timeline.length > 0) {
      // Se não achou o ponto exato (ex: mudou o ano), pega o último disponível daquela timeline
      return dashboard.timeline[dashboard.timeline.length - 1];
    }
    return null;
  }, [selectedMonthPoint, dashboard.timeline]);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/95">
          {label && <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>}
          <div className="space-y-2">
            {payload.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload?.fill || item.color || chartColors.resultado }} />
                  <span className="text-xs font-bold text-gray-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-xs font-black tabular-nums" style={{ color: item.payload?.fill || item.color || chartColors.resultado }}>
                  {formatCurrencyBRL(item.value || 0)}
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
          <PageContainer><div className="h-10 w-64 animate-pulse rounded-md bg-gray-200" /></PageContainer>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-gray-200" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                <BarChart3 size={32} className="text-blue-600 dark:text-blue-400" />
                Dashboard de Investimentos
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Análise consolidada da sua carteira de ativos.</p>
            </div>
            <AppButton
              tone={showFilters ? "outline-primary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
              startIcon={<Filter size={18} />}
            >
              Filtros
              {(filterMesAno !== currentMonthKey || filterAno !== currentYearStr) && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900" />
              )}
            </AppButton>
          </div>
        </PageContainer>

        <div className={`filter-panel-surface ${!showFilters ? "hidden" : "block animate-in fade-in slide-in-from-top-2"}`}>
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Filtros de Carteira</h3>
            <button onClick={handleClearFilters} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition dark:text-blue-400">Limpar tudo</button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <TextField type="month" label="Mês/Ano" variant="outlined" size="small" fullWidth value={filterMesAno} onChange={(e) => setFilterMesAno(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField select label="Ano" variant="outlined" size="small" fullWidth value={filterAno} onChange={(e) => setFilterAno(e.target.value)}>
              {availableYears.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
            </TextField>
            <TextField select label="Status" variant="outlined" size="small" fullWidth value={filterAtivo} onChange={(e) => setFilterAtivo(e.target.value as AtivoFilter)}>
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="ATIVOS">Ativos</MenuItem>
              <MenuItem value="INATIVOS">Inativos</MenuItem>
            </TextField>
            <TextField select label="Banco" variant="outlined" size="small" fullWidth value={filterBanco} onChange={(e) => setFilterBanco(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value))}>
              <MenuItem value="TODOS">Todos</MenuItem>
              {banks.sort((a,b) => a.nome.localeCompare(b.nome)).map((bank) => <MenuItem key={bank.id} value={bank.id}>{bank.nome}</MenuItem>)}
            </TextField>
          </div>
        </div>

        {/* Cards Premium com Ícone na Direita e Cores Sincronizadas */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Aporte", value: displayPoint?.aporte || 0, icon: ArrowUpRight, color: "amber", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800/50", iconBg: "bg-amber-100 dark:bg-amber-900/30" },
            { title: "Resgate", value: displayPoint?.resgate || 0, icon: ArrowDownRight, color: "red", text: "text-red-600 dark:text-red-400", bg: "bg-red-50/50 dark:bg-red-900/10", border: "border-red-200 dark:border-red-800/50", iconBg: "bg-red-100 dark:bg-red-900/30" },
            { title: "Rendimentos", value: displayPoint?.rendimentos || 0, icon: TrendingUp, color: "emerald", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800/50", iconBg: "bg-emerald-100 dark:bg-emerald-900/30" },
            { title: "Saldo Atual", value: displayPoint?.saldo || 0, icon: DollarSign, color: "blue", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/50 dark:bg-blue-900/10", border: "border-blue-200 dark:border-blue-800/50", iconBg: "bg-blue-100 dark:bg-blue-900/30" },
          ].map((card, i) => (
            <div key={i} className={`group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 ${card.bg} ${card.border}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-[0.1em] opacity-80 ${card.text}`}>{card.title}</p>
                  <p className={`mt-2 text-2xl font-black tabular-nums tracking-tight ${card.text}`}>{formatCurrencyBRL(card.value)}</p>
                </div>
                <div className={`rounded-xl p-2.5 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 ${card.iconBg} ${card.text}`}>
                  <card.icon size={24} />
                </div>
              </div>
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100 bg-current opacity-10`} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Movimentações Mensais */}
          <div className="app-surface p-6 overflow-hidden min-h-[400px] flex flex-col">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Movimentações Mensais</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Ano {filterAno === "TODOS" ? currentYearStr : filterAno}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"><Activity size={20} /></div>
            </div>
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
                    tick={{ fontSize: 10, fill: "rgb(var(--app-text-secondary))", fontWeight: 700 }} 
                    interval={0} 
                    minTickGap={0}
                    padding={{ left: 10, right: 10 }}
                    tickFormatter={(value) => value.split('/')[0]} 
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '30px' }} />
                  <Area type="monotone" dataKey="aporte" name="Aporte" stroke={chartColors.aporte} strokeWidth={4} fillOpacity={1} fill="url(#color-inv-aporte)" animationDuration={1500} />
                  <Area type="monotone" dataKey="resgate" name="Resgate" stroke={chartColors.resgate} strokeWidth={4} fillOpacity={1} fill="url(#color-inv-resgate)" animationDuration={1500} />
                  <Area type="monotone" dataKey="rendimentos" name="Rendimento" stroke={chartColors.rendimento} strokeWidth={4} fillOpacity={1} fill="url(#color-inv-rendimento)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evolução do Patrimônio */}
          <div className="app-surface p-6 overflow-hidden min-h-[400px] flex flex-col">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Evolução do Patrimônio</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Saldo acumulado</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"><TrendingUp size={20} /></div>
            </div>
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
                    tick={{ fontSize: 10, fill: "rgb(var(--app-text-secondary))", fontWeight: 700 }} 
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
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Análise de {monthLabel}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Composição do período</p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"><PieIcon size={20} /></div>
            </div>
            
            <div className="flex-1 w-full relative flex flex-col justify-center">
              <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={monthAnalysisData} cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" paddingAngle={8} cornerRadius={10} dataKey="value" stroke="none" animationDuration={1200}>
                      {monthAnalysisData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} style={{ outline: 'none' }} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-1">Saldo</span>
                  <span className="text-2xl font-black tabular-nums tracking-tighter text-blue-600 dark:text-blue-400 block">
                    {formatCurrencyBRL(displayPoint?.saldo || 0)}
                  </span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-2xl mx-auto">
                {monthAnalysisData.length > 0 ? monthAnalysisData.map((d, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/30 flex flex-col items-center text-center shadow-sm">
                    <span className="text-[10px] font-black uppercase mb-1" style={{ color: d.fill }}>{d.name}</span>
                    <span className="text-base font-black tabular-nums" style={{ color: d.fill }}>{formatCurrencyBRL(d.value)}</span>
                  </div>
                )) : (
                  <div className="col-span-3 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sem movimentações no mês</div>
                )}
              </div>
            </div>
          </div>

          <div className="app-surface p-6 lg:col-span-1 overflow-hidden">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-slate-300">Carteira Atual</h3>
            </div>
            
            <div className="mb-6 rounded-2xl bg-blue-50/50 p-4 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
               <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 opacity-70 mb-1">Saldo Total</p>
               <p className="text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrencyBRL(dashboard.carteira.saldo_total)}</p>
               <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{dashboard.carteira.total_ativos} Ativos Ativos</p>
            </div>

            <div className="overflow-y-auto max-h-[300px] custom-scrollbar">
              <div className="space-y-3 pr-2">
                {dashboard.carteira.ativos.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 text-xs">Nenhum ativo encontrado.</p>
                ) : (
                  dashboard.carteira.ativos.map((item) => (
                    <div key={item.id} className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-700/30 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.nome}</span>
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase ${item.ativo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {item.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 dark:text-slate-400 truncate max-w-[100px]">{item.banco_nome || "Sem Banco"}</span>
                        <span className="font-black text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrencyBRL(Number(item.saldo_atual || 0))}</span>
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
