"use client";

import React from "react";
import ChartCardHeader from "@/components/ChartCardHeader";
import { formatCompactCurrency } from "@/utils/format";
import CategoryIcon from "@/components/CategoryIcon";
import { BarChart3, BarChartHorizontal, TrendingUp, PieChart as PieChartIcon, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyPoint {
  monthKey: string;
  monthLabel: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface DashboardChartsProps {
  comparisonData: any[];
  timeline: MonthlyPoint[];
  summary: {
    total_receita: number;
    total_despesa: number;
    total_liquido: number;
  };
  byCategory: any[];
  isMobile: boolean;
  chartColors: any;
  getTooltipSeriesColor: (seriesName: string) => string;
  currency: (value: number) => string;
  hasData: boolean;
  filterAno: string;
  filterMesAno: string;
}

const percentFormatter = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function DashboardCharts({
  comparisonData,
  timeline,
  summary,
  byCategory,
  isMobile,
  chartColors,
  getTooltipSeriesColor,
  currency,
  hasData,
  filterAno,
  filterMesAno,
}: DashboardChartsProps) {

  const formatPeriodLabel = (mesAno?: string) => {
    const target = mesAno || filterMesAno;
    if (target) {
      const [year, month] = target.split("-");
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} de ${year}`;
    }
    return filterAno === "TODOS" ? "Histórico Completo" : `Ano de ${filterAno}`;
  };

  const periodLabel = formatPeriodLabel();
  
  const compositionData = [
    { name: "Receitas", value: summary.total_receita, fill: chartColors.receitas },
    { name: "Despesas", value: summary.total_despesa, fill: chartColors.despesas },
  ];

  const totalComposition = summary.total_receita + summary.total_despesa;
  const maxCategoryValue = byCategory.reduce((max, item) => Math.max(max, item.value), 0);

  const donutInnerRadius = isMobile ? "70%" : "75%";
  const donutOuterRadius = isMobile ? "90%" : "95%";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/95">
          {label && <p className="mb-2 text-xs font-medium text-[rgb(var(--app-text-muted))]">{label}</p>}
          <div className="space-y-2">
            {payload.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload?.fill || item.color || getTooltipSeriesColor(item.name || "") }} />
                  <span className="text-xs text-[rgb(var(--app-text-secondary))]">{item.name}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums" style={{ color: item.payload?.fill || item.color || getTooltipSeriesColor(item.name || "") }}>
                  {currency(item.value || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!hasData) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="app-surface flex h-80 flex-col items-center justify-center p-6 text-center">
          <BarChart3 size={48} className="mb-4 text-gray-200 dark:text-slate-800" />
          <p className="text-sm font-medium text-gray-500">Sem dados para análise visual.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Evolução Financeira */}
      <div className="app-surface p-6 overflow-hidden flex flex-col h-auto min-h-[480px] sm:h-[480px]">
        <ChartCardHeader
          title="Evolução Financeira"
          subtitle={filterAno === "TODOS" ? "Histórico Completo" : `Análise de ${filterAno}`}
          icon={<TrendingUp size={20} />}
          iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {['receitas', 'despesas', 'saldo'].map(key => (
                  <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors[key as keyof typeof chartColors]} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chartColors[key as keyof typeof chartColors]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--app-border-default), 0.1)" />
              <XAxis 
                dataKey="monthLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "rgb(var(--app-text-secondary))", fontWeight: 500 }} 
                interval={0} 
                minTickGap={0}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingBottom: '24px' }} />
              <Area type="monotone" dataKey="receitas" name="Receitas" stroke={chartColors.receitas} strokeWidth={4} fillOpacity={1} fill="url(#color-receitas)" animationDuration={1500} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke={chartColors.despesas} strokeWidth={4} fillOpacity={1} fill="url(#color-despesas)" animationDuration={1500} />
              <Area type="monotone" dataKey="saldo" name="Saldo" stroke={chartColors.saldo} strokeWidth={4} fillOpacity={1} fill="url(#color-saldo)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Composição do Período */}
      <div className="app-surface p-6 overflow-hidden flex flex-col h-auto min-h-[480px] sm:h-[480px]">
        <ChartCardHeader
          title="Composição do Período"
          subtitle={periodLabel}
          icon={<PieChartIcon size={20} />}
          iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
        />
        <div className="flex-1 w-full relative flex flex-col justify-center">
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={compositionData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={donutInnerRadius} 
                  outerRadius={donutOuterRadius} 
                  paddingAngle={8} 
                  cornerRadius={10} 
                  dataKey="value" 
                  stroke="none" 
                  animationDuration={1200}
                >
                  {compositionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="mb-1 block text-xs font-medium text-[rgb(var(--app-text-muted))]">Resultado</span>
              <span className="text-2xl font-bold tabular-nums tracking-tighter text-blue-600 dark:text-blue-400">
                {currency(summary.total_liquido)}
              </span>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
            <div className="bg-gray-50 dark:bg-slate-800/40 rounded-lg p-3 border border-gray-100 dark:border-slate-700/30 flex flex-col items-center">
              <span className="mb-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">Receitas</span>
              <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{currency(summary.total_receita)}</span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/40 rounded-lg p-3 border border-gray-100 dark:border-slate-700/30 flex flex-col items-center">
              <span className="mb-1 text-xs font-medium text-rose-600 dark:text-rose-400">Despesas</span>
              <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">{currency(summary.total_despesa)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Realizado vs Projetado */}
      <div className="app-surface p-6 overflow-hidden flex flex-col h-auto min-h-[480px] sm:h-[480px]">
        <ChartCardHeader
          title="Realizado vs Projetado"
          subtitle={periodLabel}
          icon={<BarChart3 size={20} />}
          iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        />
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} barGap={16} margin={{ top: 40, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--app-border-default), 0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500, fill: "rgb(var(--app-text-secondary))" }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.04 }} />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingBottom: '24px' }} />
              <Bar dataKey="Pago" fill={chartColors.pago} radius={[8, 8, 0, 0]} barSize={isMobile ? 32 : 56} animationDuration={1500}>
                {/* Valor compacto sobre a barra; o valor completo aparece no tooltip. No celular não há espaço para o rótulo */}
                {!isMobile && (
                  <LabelList dataKey="Pago" position="top" offset={15} formatter={(v: any) => formatCompactCurrency(Number(v))} style={{ fontSize: 12, fontWeight: 600, fill: chartColors.pago }} />
                )}
              </Bar>
              <Bar dataKey="Provisao" name="Provisão" fill={chartColors.pendente} radius={[8, 8, 0, 0]} barSize={isMobile ? 32 : 56} animationDuration={1500}>
                {!isMobile && (
                  <LabelList dataKey="Provisao" position="top" offset={15} formatter={(v: any) => formatCompactCurrency(Number(v))} style={{ fontSize: 12, fontWeight: 600, fill: chartColors.pendente }} />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Gastos por Categoria */}
      <div className="app-surface p-6 overflow-hidden flex flex-col h-auto min-h-[480px] sm:h-[480px]">
        <ChartCardHeader
          title="Gastos por Categoria"
          subtitle={periodLabel}
          icon={<BarChartHorizontal size={20} />}
          iconClassName="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
        {/* Barras horizontais ordenadas: comparar comprimentos é mais fácil que comparar fatias */}
        <ul className="flex flex-1 flex-col justify-center gap-4">
          {byCategory.map((item) => {
            const share = summary.total_despesa > 0 ? item.value / summary.total_despesa : 0;
            const width = maxCategoryValue > 0 ? (item.value / maxCategoryValue) * 100 : 0;
            return (
              <li key={item.name}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <CategoryIcon nome={item.name} tipo="DESPESA" size="sm" />
                    <span className="truncate text-sm text-[rgb(var(--app-text-secondary))]" title={item.name}>{item.name}</span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-2">
                    <span className="text-sm font-semibold tabular-nums text-[rgb(var(--app-text-primary))]">{currency(item.value)}</span>
                    <span className="w-10 text-right text-xs tabular-nums text-[rgb(var(--app-text-muted))]">{percentFormatter.format(share)}</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[rgb(var(--app-border-subtle))]">
                  <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: chartColors.despesas }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
