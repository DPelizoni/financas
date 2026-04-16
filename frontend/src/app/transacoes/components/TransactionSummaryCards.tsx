"use client";

import React from "react";
import { TransacaoSummary } from "@/types/transacao";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  DollarSign,
  TrendingUp,
  Receipt,
  PieChart,
} from "lucide-react";

interface TransactionSummaryCardsProps {
  summary: TransacaoSummary | null;
}

export function TransactionSummaryCards({
  summary,
}: TransactionSummaryCardsProps) {
  if (!summary) return null;

  const formatCurrency = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const CardGroup = ({ 
    title, 
    icon: Icon,
    receita, 
    despesa, 
    liquido,
    accentColor 
  }: { 
    title: string;
    icon: any;
    receita: number;
    despesa: number;
    liquido: number;
    accentColor: "blue" | "green" | "amber";
  }) => {
    const colors = {
      blue: {
        border: "border-blue-200 dark:border-blue-800/50",
        bg: "bg-blue-50/50 dark:bg-blue-900/10",
        text: "text-blue-900 dark:text-blue-300",
        glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
      },
      green: {
        border: "border-green-200 dark:border-green-800/50",
        bg: "bg-green-50/50 dark:bg-green-900/10",
        text: "text-green-900 dark:text-green-300",
        glow: "hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]",
      },
      amber: {
        border: "border-amber-200 dark:border-amber-800/50",
        bg: "bg-amber-50/50 dark:bg-amber-900/10",
        text: "text-amber-900 dark:text-amber-300",
        glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      }
    };

    const config = colors[accentColor];

    return (
      <div className={`group relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} p-5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 ${config.glow}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${config.text} opacity-80`}>
            {title}
          </h3>
          <div className={`rounded-lg ${config.bg} p-2 ${config.text} transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110`}>
            <Icon size={20} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <ArrowUpNarrowWide size={16} />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Receitas</span>
            </div>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {formatCurrency(receita)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <ArrowDownWideNarrow size={16} />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Despesas</span>
            </div>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
              {formatCurrency(despesa)}
            </span>
          </div>

          <div className="mt-2 border-t border-gray-200/50 pt-4 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${liquido >= 0 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                  <DollarSign size={16} />
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Saldo Líquido</span>
              </div>
              <span className={`text-lg font-black ${liquido >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(liquido)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${config.bg} opacity-20 blur-2xl`} />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <CardGroup 
        title="Totais do Período" 
        icon={PieChart}
        receita={summary.total_receita}
        despesa={summary.total_despesa}
        liquido={summary.total_liquido}
        accentColor="blue"
      />
      
      <CardGroup 
        title="Valores Realizados" 
        icon={TrendingUp}
        receita={summary.pago_receita}
        despesa={summary.pago_despesa}
        liquido={summary.pago_liquido}
        accentColor="green"
      />

      <CardGroup 
        title="Provisões Pendentes" 
        icon={Receipt}
        receita={summary.provisao_receita}
        despesa={summary.provisao_despesa}
        liquido={summary.provisao_liquido}
        accentColor="amber"
      />
    </div>
  );
}
