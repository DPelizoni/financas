"use client";

import React from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  DollarSign,
} from "lucide-react";

interface SummaryCardsProps {
  summary: {
    total_receita: number;
    total_despesa: number;
    total_liquido: number;
  };
  currency: (value: number) => string;
}

export function SummaryCards({ summary, currency }: SummaryCardsProps) {
  const Card = ({ 
    title, 
    value, 
    icon: Icon,
    color 
  }: { 
    title: string;
    value: number;
    icon: any;
    color: "green" | "red" | "blue";
  }) => {
    const themes = {
      green: {
        border: "border-green-200 dark:border-green-800/50 border-t-green-500",
        bg: "bg-green-50/80 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        iconContainer: "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
        glow: "hover:shadow-[0_8px_30px_rgb(34,197,94,0.12)]",
      },
      red: {
        border: "border-red-200 dark:border-red-800/50 border-t-red-500",
        bg: "bg-red-50/80 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        iconContainer: "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400",
        glow: "hover:shadow-[0_8px_30px_rgb(239,68,68,0.12)]",
      },
      blue: {
        border: "border-blue-200 dark:border-blue-800/50 border-t-blue-500",
        bg: "bg-blue-50/80 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        iconContainer: "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400",
        glow: "hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)]",
      }
    };

    const theme = themes[color];

    return (
      <div className={`group relative overflow-hidden rounded-2xl border-t-4 border ${theme.border} ${theme.bg} p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 ${theme.glow}`}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className={`text-xs font-black uppercase tracking-[0.15em] opacity-90 ${theme.text}`}>
              {title}
            </p>
            <p className={`mt-2 text-2xl font-black tabular-nums tracking-tight ${theme.text}`}>
              {currency(value)}
            </p>
          </div>
          <div className={`rounded-xl ${theme.iconContainer} p-3 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110`}>
            <Icon size={28} />
          </div>
        </div>
        <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${theme.bg} opacity-20 blur-3xl transition-opacity duration-700 group-hover:opacity-40`} />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card 
        title="Receitas" 
        value={summary.total_receita} 
        icon={ArrowUpNarrowWide} 
        color="green" 
      />
      <Card 
        title="Despesas" 
        value={summary.total_despesa} 
        icon={ArrowDownWideNarrow} 
        color="red" 
      />
      <Card 
        title="Saldo Líquido" 
        value={summary.total_liquido} 
        icon={DollarSign} 
        color={summary.total_liquido >= 0 ? "blue" : "red"} 
      />
    </div>
  );
}
