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
import { formatCurrency } from "@/utils/format";

interface TransactionSummaryCardsProps {
  summary: TransacaoSummary | null;
}

export function TransactionSummaryCards({
  summary,
}: TransactionSummaryCardsProps) {
  if (!summary) return null;

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
        border: "border-app-info-border dark:border-blue-800/50 border-t-blue-500 dark:border-t-blue-500",
        bg: "bg-blue-50/80 dark:bg-blue-900/20",
        text: "text-app-info-text dark:text-blue-200",
        iconContainer: "bg-app-info-surface dark:bg-blue-800/40 text-app-brand-primary dark:text-blue-300",
      },
      green: {
        border: "border-app-success-border dark:border-green-800/50 border-t-green-500 dark:border-t-green-500",
        bg: "bg-green-50/80 dark:bg-green-900/20",
        text: "text-app-success-text dark:text-green-200",
        iconContainer: "bg-app-success-surface dark:bg-green-800/40 text-app-success-text dark:text-green-300",
      },
      amber: {
        border: "border-amber-200 dark:border-amber-800/50 border-t-amber-500 dark:border-t-amber-500",
        bg: "bg-amber-50/80 dark:bg-amber-900/20",
        text: "text-amber-900 dark:text-amber-200",
        iconContainer: "bg-app-warning-surface dark:bg-amber-800/40 text-amber-600 dark:text-amber-300",
      }
    };

    const config = colors[accentColor];

    return (
      <div className={`rounded-lg border border-t-4 ${config.border} ${config.bg} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${config.text}`}>
            {title}
          </h3>
          <div className={`rounded-md ${config.iconContainer} p-2`}>
            <Icon size={20} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-app-success-surface dark:bg-green-900/30 text-app-success-text dark:text-green-400">
                <ArrowUpNarrowWide size={16} />
              </div>
              <span className="text-sm font-medium text-app-text-muted dark:text-slate-400">Receitas</span>
            </div>
            <span className="whitespace-nowrap text-base font-semibold tabular-nums text-app-success-text dark:text-green-400">
              {formatCurrency(receita)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-app-error-surface dark:bg-red-900/30 text-app-error-text dark:text-red-400">
                <ArrowDownWideNarrow size={16} />
              </div>
              <span className="text-sm font-medium text-app-text-muted dark:text-slate-400">Despesas</span>
            </div>
            <span className="whitespace-nowrap text-base font-semibold tabular-nums text-app-error-text dark:text-red-400">
              {formatCurrency(despesa)}
            </span>
          </div>

          <div className="mt-2 border-t border-gray-200/50 pt-4 dark:border-slate-700/50">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${liquido >= 0 ? "bg-app-info-surface dark:bg-blue-900/30 text-app-brand-primary dark:text-blue-400" : "bg-app-error-surface dark:bg-red-900/30 text-app-error-text dark:text-red-400"}`}>
                  <DollarSign size={16} />
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-slate-300">Saldo Líquido</span>
              </div>
              <span className={`ml-auto whitespace-nowrap text-2xl font-bold tabular-nums tracking-tight xl:text-xl 2xl:text-2xl ${liquido >= 0 ? "text-app-brand-primary dark:text-blue-400" : "text-app-error-text dark:text-red-400"}`}>
                {formatCurrency(liquido)}
              </span>
            </div>
          </div>
        </div>
        
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
