"use client";

import React from "react";
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

const categoryPalette = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1"
];

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

  const donutInnerRadius = isMobile ? "70%" : "75%";
  const donutOuterRadius = isMobile ? "90%" : "95%";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/95">
          {label && <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>}
          <div className="space-y-2">
            {payload.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload?.fill || item.color || getTooltipSeriesColor(item.name || "") }} />
                  <span className="text-xs font-bold text-gray-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-xs font-black tabular-nums" style={{ color: item.payload?.fill || item.color || getTooltipSeriesColor(item.name || "") }}>
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
      <div className="app-surface p-6 overflow-hidden flex flex-col h-[480px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Evolução Financeira</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
              {filterAno === "TODOS" ? "Histórico Completo" : `Análise de ${filterAno}`}
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"><TrendingUp size={20} /></div>
        </div>
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
                tick={{ fontSize: 10, fill: "rgb(var(--app-text-secondary))", fontWeight: 700 }} 
                interval={0} 
                minTickGap={0}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '30px' }} />
              <Area type="monotone" dataKey="receitas" name="Receitas" stroke={chartColors.receitas} strokeWidth={4} fillOpacity={1} fill="url(#color-receitas)" animationDuration={1500} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke={chartColors.despesas} strokeWidth={4} fillOpacity={1} fill="url(#color-despesas)" animationDuration={1500} />
              <Area type="monotone" dataKey="saldo" name="Saldo" stroke={chartColors.saldo} strokeWidth={4} fillOpacity={1} fill="url(#color-saldo)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Composição do Período */}
      <div className="app-surface p-6 overflow-hidden flex flex-col h-[480px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Composição do Período</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
              {periodLabel}
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"><PieChartIcon size={20} /></div>
        </div>
        <div className="flex-1 w-full relative flex flex-col justify-center">
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={compositionData} cx="50%" cy="50%" innerRadius={donutInnerRadius} outerRadius={donutOuterRadius} paddingAngle={8} cornerRadius={10} dataKey="value" stroke="none" animationDuration={1200}>
                  {compositionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-1">Resultado</span>
              <span className="text-2xl font-black tabular-nums tracking-tighter text-blue-600 dark:text-blue-400">
                {currency(summary.total_liquido)}
              </span>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto w-full">
            <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-gray-100 dark:border-slate-700/30 flex flex-col items-center">
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">Receitas</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{currency(summary.total_receita)}</span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-gray-100 dark:border-slate-700/30 flex flex-col items-center">
              <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase mb-1">Despesas</span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400">{currency(summary.total_despesa)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Realizado vs Projetado */}
      <div className="app-surface p-6 overflow-hidden flex flex-col h-[480px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Realizado vs Projetado</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{periodLabel}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"><BarChart3 size={20} /></div>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} barGap={12} margin={{ top: 40, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--app-border-default), 0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: "rgb(var(--app-text-primary))" }} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.04 }} />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '30px' }} />
              <Bar dataKey="Pago" fill={chartColors.pago} radius={[8, 8, 0, 0]} barSize={isMobile ? 32 : 56} animationDuration={1500}>
                <LabelList dataKey="Pago" position="top" offset={15} formatter={(v: any) => currency(Number(v))} style={{ fontSize: 10, fontWeight: 900, fill: chartColors.pago }} />
              </Bar>
              <Bar dataKey="Provisao" name="Provisão" fill={chartColors.pendente} radius={[8, 8, 0, 0]} barSize={isMobile ? 32 : 56} animationDuration={1500}>
                <LabelList dataKey="Provisao" position="top" offset={15} formatter={(v: any) => currency(Number(v))} style={{ fontSize: 10, fontWeight: 900, fill: chartColors.pendente }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Gastos por Categoria */}
      <div className="app-surface p-6 overflow-hidden flex flex-col h-[480px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.1em] text-gray-800 dark:text-slate-200">Gastos por Categoria</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{periodLabel}</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"><PieChartIcon size={20} /></div>
        </div>
        <div className="flex-1 w-full relative flex flex-col sm:flex-row items-center">
          <div className="h-64 w-full sm:w-1/2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" innerRadius="75%" outerRadius="95%" paddingAngle={4} cornerRadius={6} dataKey="value" nameKey="name" stroke="none" animationDuration={1500}>
                  {byCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={categoryPalette[index % categoryPalette.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <PieChartIcon size={24} className="text-gray-200 dark:text-slate-700 mx-auto" />
            </div>
          </div>
          <div className="w-full sm:w-1/2 mt-6 sm:mt-0 sm:pl-8 overflow-y-auto max-h-64 scrollbar-hide">
            <div className="space-y-3">
              {byCategory.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryPalette[index % categoryPalette.length] }} />
                    <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400 truncate max-w-[100px]">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-gray-800 dark:text-slate-200 tabular-nums">{currency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
