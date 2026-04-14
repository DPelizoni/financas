"use client";

import React from "react";
import { TransacaoSummary } from "@/types/transacao";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  DollarSign,
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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* Totais */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
        <h3 className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-300">
          Totais
        </h3>
        <div className="space-y-3">
          <div className="app-surface group cursor-default p-4 flex items-center justify-between transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Receita</p>
              <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.total_receita)}
              </p>
            </div>
            <div className="text-green-500 dark:text-green-400 opacity-80 transition-transform group-hover:scale-110">
              <ArrowUpNarrowWide size={24} />
            </div>
          </div>

          <div className="app-surface group cursor-default p-4 flex items-center justify-between transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Despesa</p>
              <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.total_despesa)}
              </p>
            </div>
            <div className="text-red-500 dark:text-red-400 opacity-80 transition-transform group-hover:scale-110">
              <ArrowDownWideNarrow size={24} />
            </div>
          </div>

          <div className="app-surface group cursor-default p-4 flex items-center justify-between transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Líquido</p>
              <p
                className={`mt-1 text-xl font-bold ${
                  summary.total_liquido >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(summary.total_liquido)}
              </p>
            </div>
            <div className={`${summary.total_liquido >= 0 ? "text-blue-500 dark:text-blue-400" : "text-red-500 dark:text-red-400"} opacity-80 transition-transform group-hover:scale-110`}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Pagos */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/20">
        <h3 className="mb-3 text-sm font-semibold text-green-900 dark:text-green-300">
          Pagos
        </h3>
        <div className="space-y-3">
          <div className="app-surface group cursor-default p-4 flex items-center justify-between transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Receita</p>
              <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.pago_receita)}
              </p>
            </div>
            <div className="text-green-500 dark:text-green-400 opacity-80 transition-transform group-hover:scale-110">
              <ArrowUpNarrowWide size={24} />
            </div>
          </div>

          <div className="app-surface group cursor-default p-4 flex items-center justify-between transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Despesa</p>
              <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.pago_despesa)}
              </p>
            </div>
            <div className="text-red-500 dark:text-red-400 opacity-80 transition-transform group-hover:scale-110">
              <ArrowDownWideNarrow size={24} />
            </div>
          </div>

          <div className="app-surface group cursor-default p-4 flex items-center justify-between transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Líquido</p>
              <p
                className={`mt-1 text-xl font-bold ${
                  summary.pago_liquido >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(summary.pago_liquido)}
              </p>
            </div>
            <div className={`${summary.pago_liquido >= 0 ? "text-blue-500 dark:text-blue-400" : "text-red-500 dark:text-red-400"} opacity-80 transition-transform group-hover:scale-110`}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Provisões */}
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-900/30 dark:bg-yellow-900/20">
        <h3 className="mb-3 text-sm font-semibold text-yellow-900 dark:text-yellow-300">
          Provisões
        </h3>
        <div className="space-y-3">
          <div className="app-surface group cursor-default p-4 flex items-center justify-between transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Receita</p>
              <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.provisao_receita)}
              </p>
            </div>
            <div className="text-green-500 dark:text-green-400 opacity-80 transition-transform group-hover:scale-110">
              <ArrowUpNarrowWide size={24} />
            </div>
          </div>

          <div className="app-surface group cursor-default p-4 flex items-center justify-between transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Despesa</p>
              <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.provisao_despesa)}
              </p>
            </div>
            <div className="text-red-500 dark:text-red-400 opacity-80 transition-transform group-hover:scale-110">
              <ArrowDownWideNarrow size={24} />
            </div>
          </div>

          <div className="app-surface group cursor-default p-4 flex items-center justify-between transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-slate-400">Líquido</p>
              <p
                className={`mt-1 text-xl font-bold ${
                  summary.provisao_liquido >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(summary.provisao_liquido)}
              </p>
            </div>
            <div className={`${summary.provisao_liquido >= 0 ? "text-blue-500 dark:text-blue-400" : "text-red-500 dark:text-red-400"} opacity-80 transition-transform group-hover:scale-110`}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
