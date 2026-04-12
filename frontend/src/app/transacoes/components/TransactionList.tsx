"use client";

import React from "react";
import { Transacao } from "@/types/transacao";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckCircle2,
  Clock,
  Plus,
  Search,
} from "lucide-react";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import Icon from "@mdi/react";
import { mdiBroom } from "@mdi/js";

interface TransactionListProps {
  transacoes: Transacao[];
  loading: boolean;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: any) => void;
  onView: (transacao: Transacao) => void;
  onEdit: (transacao: Transacao) => void;
  onDelete: (id: number, mes: string) => void;
  onToggleSituacao: (transacao: Transacao) => void;
  onAddTransaction: () => void;
  onClearFilters: () => void;
}

const tipoLabel: Record<"DESPESA" | "RECEITA", string> = {
  DESPESA: "Despesa",
  RECEITA: "Receita",
};

const situacaoLabel: Record<"PENDENTE" | "PAGO", string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
};

const formatCurrency = (valor: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

export function TransactionList({
  transacoes,
  loading,
  sortBy,
  sortDirection,
  onSort,
  onView,
  onEdit,
  onDelete,
  onToggleSituacao,
  onAddTransaction,
  onClearFilters,
}: TransactionListProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="md:hidden">
          <CardSkeleton count={3} />
        </div>
        <div className="hidden md:block">
          <TableSkeleton rows={8} columns={9} />
        </div>
      </div>
    );
  }

  if (transacoes.length === 0) {
    return (
      <div className="app-surface p-4">
        <EmptyState
          icon={Search}
          title="Nenhum lançamento encontrado"
          description="Tente ajustar seus filtros ou busque por um termo diferente para encontrar o que procura."
          actionLabel="Novo Lançamento"
          onAction={onAddTransaction}
        />
        <div className="mt-4 flex justify-center border-t border-gray-100 pt-4 dark:border-slate-800">
          <AppButton
            tone="outline"
            onClick={onClearFilters}
            startIcon={<Icon path={mdiBroom} size={0.7} />}
          >
            Limpar Filtros
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="app-surface p-4">
      {/* Mobile View */}
      <div className="px-2 sm:px-0 md:hidden">
        <div className="space-y-2">
          {transacoes.map((transacao) => (
            <div
              key={transacao.id}
              className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:from-slate-800 dark:to-slate-900/50 dark:border-slate-700/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {transacao.descricao_nome || "Sem descrição"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">
                    {transacao.mes} • Vencimento {transacao.vencimento}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                    transacao.tipo === "DESPESA"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  }`}
                >
                  {tipoLabel[transacao.tipo]}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                <p>
                  <span className="font-medium">Categoria: </span>
                  {transacao.categoria_nome || "-"}
                </p>
                <p>
                  <span className="font-medium">Banco: </span>
                  {transacao.banco_nome || "-"}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => onToggleSituacao(transacao)}
                  className={`inline-flex min-h-[22px] items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-all active:scale-95 ${
                    transacao.situacao === "PAGO"
                      ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50 hover:bg-green-200 dark:hover:bg-green-900/50"
                      : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                  }`}
                >
                  {transacao.situacao === "PAGO" ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  {situacaoLabel[transacao.situacao]}
                </button>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(transacao.valor)}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                <TableActionButton
                  action="view"
                  title="Visualizar"
                  onClick={() => onView(transacao)}
                />
                <TableActionButton
                  action="edit"
                  title="Editar"
                  onClick={() => onEdit(transacao)}
                />
                <TableActionButton
                  action="delete"
                  title="Excluir"
                  onClick={() => onDelete(transacao.id, transacao.mes)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed divide-y divide-gray-200 text-xs dark:divide-slate-800">
          <thead className="app-table-head">
            <tr>
              <th className="app-table-head-cell w-[8%]">
                <button
                  type="button"
                  onClick={() => onSort("mes")}
                  className="inline-flex items-center gap-1"
                >
                  Mês
                  {sortBy === "mes" && sortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} />
                  ) : sortBy === "mes" ? (
                    <ArrowDownWideNarrow size={14} />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell hidden w-[10%] lg:table-cell">
                <button
                  type="button"
                  onClick={() => onSort("vencimento")}
                  className="inline-flex items-center gap-1"
                >
                  Vencimento
                  {sortBy === "vencimento" && sortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} />
                  ) : sortBy === "vencimento" ? (
                    <ArrowDownWideNarrow size={14} />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[8%]">
                <button
                  type="button"
                  onClick={() => onSort("tipo")}
                  className="inline-flex items-center gap-1"
                >
                  Tipo
                  {sortBy === "tipo" && sortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} />
                  ) : sortBy === "tipo" ? (
                    <ArrowDownWideNarrow size={14} />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[13%]">
                <button
                  type="button"
                  onClick={() => onSort("categoria")}
                  className="inline-flex items-center gap-1"
                >
                  Categoria
                  {sortBy === "categoria" && sortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} />
                  ) : sortBy === "categoria" ? (
                    <ArrowDownWideNarrow size={14} />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[22%]">
                <button
                  type="button"
                  onClick={() => onSort("descricao")}
                  className="inline-flex items-center gap-1"
                >
                  Descrição
                  {sortBy === "descricao" && sortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} />
                  ) : sortBy === "descricao" ? (
                    <ArrowDownWideNarrow size={14} />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[12%]">
                <button
                  type="button"
                  onClick={() => onSort("banco")}
                  className="inline-flex items-center gap-1"
                >
                  Banco
                  {sortBy === "banco" && sortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} />
                  ) : sortBy === "banco" ? (
                    <ArrowDownWideNarrow size={14} />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell-right w-[10%]">
                <button
                  type="button"
                  onClick={() => onSort("valor")}
                  className="inline-flex items-center gap-1"
                >
                  Valor
                  {sortBy === "valor" && sortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} />
                  ) : sortBy === "valor" ? (
                    <ArrowDownWideNarrow size={14} />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell-center w-[9%]">
                <button
                  type="button"
                  onClick={() => onSort("situacao")}
                  className="inline-flex items-center gap-1"
                >
                  Situação
                  {sortBy === "situacao" && sortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} />
                  ) : sortBy === "situacao" ? (
                    <ArrowDownWideNarrow size={14} />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell-center w-[8%]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {transacoes.map((transacao) => (
              <tr
                key={transacao.id}
                className={`app-table-row ${
                  transacao.situacao === "PAGO"
                    ? "app-row-pago"
                    : "app-row-pendente"
                }`}
              >
                <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">
                  {transacao.mes}
                </td>
                <td className="hidden px-3 py-2 text-xs text-gray-900 lg:table-cell dark:text-slate-300">
                  {transacao.vencimento}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                      transacao.tipo === "DESPESA"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    {tipoLabel[transacao.tipo]}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-900 dark:text-slate-300">
                  <span
                    className="block truncate"
                    title={transacao.categoria_nome || "-"}
                  >
                    {transacao.categoria_nome || "-"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-900 dark:text-slate-300">
                  <span
                    className="block truncate"
                    title={transacao.descricao_nome || "-"}
                  >
                    {transacao.descricao_nome || "-"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-900 dark:text-slate-300">
                  <span
                    className="block truncate"
                    title={transacao.banco_nome || "-"}
                  >
                    {transacao.banco_nome || "-"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-xs font-semibold dark:text-white">
                  {formatCurrency(transacao.valor)}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => onToggleSituacao(transacao)}
                    className={`inline-flex min-h-[22px] items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 ${
                      transacao.situacao === "PAGO"
                        ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50 hover:bg-green-200 dark:hover:bg-green-900/50 shadow-sm"
                        : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-900/50 shadow-sm"
                    }`}
                  >
                    {transacao.situacao === "PAGO" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    {situacaoLabel[transacao.situacao]}
                  </button>
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <TableActionButton
                      action="view"
                      title="Visualizar"
                      onClick={() => onView(transacao)}
                      compact
                    />
                    <TableActionButton
                      action="edit"
                      title="Editar"
                      onClick={() => onEdit(transacao)}
                      compact
                    />
                    <TableActionButton
                      action="delete"
                      title="Excluir"
                      onClick={() =>
                        onDelete(transacao.id, transacao.mes)
                      }
                      compact
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
