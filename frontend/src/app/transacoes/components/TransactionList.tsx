"use client";

import React from "react";
import { Transacao } from "@/types/transacao";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Search,
} from "lucide-react";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import Icon from "@mdi/react";
import { mdiBroom, mdiCheckCircle, mdiClockOutline } from "@mdi/js";

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
      <>
        <div className="sm:hidden">
          <CardSkeleton count={5} />
        </div>
        <div className="hidden sm:block">
          <TableSkeleton rows={10} columns={8} />
        </div>
      </>
    );
  }

  if (transacoes.length === 0) {
    return (
      <div className="py-8">
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
    <>
      {/* Visão Mobile - Cards */}
      <div className="px-2 sm:px-0 sm:hidden">
        <div className="space-y-3">
          {transacoes.map((transacao) => (
            <div
              key={transacao.id}
              className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm ${
                      transacao.tipo === "DESPESA" ? "bg-red-500" : "bg-green-500"
                    }`}
                  >
                    {transacao.tipo === "DESPESA" ? "D" : "R"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {transacao.descricao_nome || "Sem descrição"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-600 dark:text-slate-400">
                      <span>{transacao.mes}</span>
                      <span className="text-gray-300 dark:text-slate-700">•</span>
                      <span>{transacao.vencimento}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(transacao.valor)}
                  </p>
                  <button
                    onClick={() => onToggleSituacao(transacao)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all active:scale-95 ${
                      transacao.situacao === "PAGO"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    <Icon path={transacao.situacao === "PAGO" ? mdiCheckCircle : mdiClockOutline} size={0.4} />
                    {situacaoLabel[transacao.situacao]}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                <TableActionButton action="view" title="Visualizar" onClick={() => onView(transacao)} />
                <TableActionButton action="edit" title="Editar" onClick={() => onEdit(transacao)} />
                <TableActionButton action="delete" title="Excluir" onClick={() => onDelete(transacao.id, transacao.mes)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visão Desktop/Tablet - Tabela */}
      <div className="hidden overflow-x-auto sm:block w-full">
        <table className="min-w-[1000px] w-full table-fixed divide-y divide-gray-200 text-xs dark:divide-slate-800">
          <thead className="app-table-head">
            <tr>
              <th className="app-table-head-cell w-[8%]">
                <button type="button" onClick={() => onSort("mes")} className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                  Mês
                  {sortBy === "mes" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} className="text-blue-600" /> : sortBy === "mes" ? <ArrowDownWideNarrow size={14} className="text-blue-600" /> : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[10%]">
                <button type="button" onClick={() => onSort("vencimento")} className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                  Venc.
                  {sortBy === "vencimento" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} className="text-blue-600" /> : sortBy === "vencimento" ? <ArrowDownWideNarrow size={14} className="text-blue-600" /> : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[8%]">
                <button type="button" onClick={() => onSort("tipo")} className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                  Tipo
                  {sortBy === "tipo" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} className="text-blue-600" /> : sortBy === "tipo" ? <ArrowDownWideNarrow size={14} className="text-blue-600" /> : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[15%]">
                <button type="button" onClick={() => onSort("categoria")} className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                  Categoria
                  {sortBy === "categoria" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} className="text-blue-600" /> : sortBy === "categoria" ? <ArrowDownWideNarrow size={14} className="text-blue-600" /> : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[20%]">
                <button type="button" onClick={() => onSort("descricao")} className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                  Descrição
                  {sortBy === "descricao" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} className="text-blue-600" /> : sortBy === "descricao" ? <ArrowDownWideNarrow size={14} className="text-blue-600" /> : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[12%]">
                <button type="button" onClick={() => onSort("banco")} className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                  Banco
                  {sortBy === "banco" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} className="text-blue-600" /> : sortBy === "banco" ? <ArrowDownWideNarrow size={14} className="text-blue-600" /> : null}
                </button>
              </th>
              <th className="app-table-head-cell-right w-[10%]">
                <button type="button" onClick={() => onSort("valor")} className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                  Valor
                  {sortBy === "valor" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} className="text-blue-600" /> : sortBy === "valor" ? <ArrowDownWideNarrow size={14} className="text-blue-600" /> : null}
                </button>
              </th>
              <th className="app-table-head-cell-center w-[9%]">
                <button type="button" onClick={() => onSort("situacao")} className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
                  Situação
                  {sortBy === "situacao" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} className="text-blue-600" /> : sortBy === "situacao" ? <ArrowDownWideNarrow size={14} className="text-blue-600" /> : null}
                </button>
              </th>
              <th className="app-table-head-cell-center w-[8%]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {transacoes.map((transacao) => (
              <tr 
                key={transacao.id} 
                className={`app-table-row group ${transacao.situacao === "PAGO" ? "app-row-pago" : "app-row-pendente"}`}
              >
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200">{transacao.mes}</td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200">{transacao.vencimento}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${transacao.tipo === "DESPESA" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"}`}>
                    {transacao.tipo === "DESPESA" ? "Despesa" : "Receita"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200"><span className="block truncate" title={transacao.categoria_nome || "-"}>{transacao.categoria_nome || "-"}</span></td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200"><span className="block truncate" title={transacao.descricao_nome || "-"}>{transacao.descricao_nome || "-"}</span></td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200"><span className="block truncate" title={transacao.banco_nome || "-"}>{transacao.banco_nome || "-"}</span></td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(transacao.valor)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-center">
                  <button
                    onClick={() => onToggleSituacao(transacao)}
                    className={`inline-flex min-h-[22px] items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 ${
                      transacao.situacao === "PAGO"
                        ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50 hover:bg-green-200 dark:hover:bg-green-900/50 shadow-sm"
                        : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-900/50 shadow-sm"
                    }`}
                  >
                    <Icon path={transacao.situacao === "PAGO" ? mdiCheckCircle : mdiClockOutline} size={0.4} />
                    {situacaoLabel[transacao.situacao]}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium">
                  <div className="flex justify-center gap-1">
                    <TableActionButton action="view" title="Visualizar" onClick={() => onView(transacao)} compact />
                    <TableActionButton action="edit" title="Editar" onClick={() => onEdit(transacao)} compact />
                    <TableActionButton action="delete" title="Excluir" onClick={() => onDelete(transacao.id, transacao.mes)} compact />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
