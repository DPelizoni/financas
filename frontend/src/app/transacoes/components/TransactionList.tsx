"use client";

import React from "react";
import { Transacao } from "@/types/transacao";
import {
  Search,
  FilterX,
} from "lucide-react";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import MoneyValue from "@/components/MoneyValue";
import SituacaoBadge from "@/components/SituacaoBadge";
import SortableHeader from "@/components/SortableHeader";

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
            startIcon={<FilterX size={16} />}
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
              className={`relative overflow-hidden rounded-lg border border-gray-200/80 bg-white p-4 shadow-sm transition-all active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 ${
                transacao.tipo === "DESPESA" 
                  ? "border-l-4 border-l-red-500" 
                  : "border-l-4 border-l-green-500"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md ${
                      transacao.tipo === "DESPESA" ? "bg-red-500" : "bg-green-500"
                    }`}
                  >
                    {transacao.tipo === "DESPESA" ? "D" : "R"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {transacao.descricao_nome || "Sem descrição"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-600 dark:text-slate-400">
                      <span>{transacao.mes}</span>
                      <span className="text-gray-300 dark:text-slate-700">•</span>
                      <span>{transacao.vencimento}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <MoneyValue value={transacao.valor} tipo={transacao.tipo} className="text-sm" />
                  <div className="mt-1">
                    <SituacaoBadge situacao={transacao.situacao} onToggle={() => onToggleSituacao(transacao)} />
                  </div>
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
      <div className="app-table-scroll hidden sm:block w-full">
        <table className="min-w-[1000px] w-full table-fixed divide-y divide-gray-200 text-xs dark:divide-slate-800">
          <thead className="app-table-head">
            <tr>
              <SortableHeader label="Mês" column="mes" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} className="w-[8%]" />
              <SortableHeader label="Venc." column="vencimento" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} className="w-[10%]" />
              <SortableHeader label="Tipo" column="tipo" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} align="center" className="w-[8%]" />
              <SortableHeader label="Categoria" column="categoria" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} className="w-[15%]" />
              <SortableHeader label="Descrição" column="descricao" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} className="w-[20%]" />
              <SortableHeader label="Banco" column="banco" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} className="w-[12%]" />
              <SortableHeader label="Valor" column="valor" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} align="right" className="w-[10%]" />
              <SortableHeader label="Situação" column="situacao" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort} align="center" className="w-[9%]" />
              <th className="app-table-head-cell-center w-[8%]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {transacoes.map((transacao) => (
              <tr 
                key={transacao.id} 
                className="app-table-row group"
              >
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200">{transacao.mes}</td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200">{transacao.vencimento}</td>
                <td className="whitespace-nowrap px-3 py-2 text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${transacao.tipo === "DESPESA" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"}`}>
                    {transacao.tipo === "DESPESA" ? "Despesa" : "Receita"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200"><span className="block truncate" title={transacao.categoria_nome || "-"}>{transacao.categoria_nome || "-"}</span></td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200"><span className="block truncate" title={transacao.descricao_nome || "-"}>{transacao.descricao_nome || "-"}</span></td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-slate-200"><span className="block truncate" title={transacao.banco_nome || "-"}>{transacao.banco_nome || "-"}</span></td>
                <td className="whitespace-nowrap px-3 py-2 text-right"><MoneyValue value={transacao.valor} tipo={transacao.tipo} /></td>
                <td className="whitespace-nowrap px-3 py-2 text-center">
                  <SituacaoBadge situacao={transacao.situacao} onToggle={() => onToggleSituacao(transacao)} />
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
