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
import CategoryIcon from "@/components/CategoryIcon";
import BankLogo from "@/components/BankLogo";
import { formatSignedCurrency } from "@/utils/format";

interface DayGroup {
  key: string;
  label: string | null;
  net: number;
  items: Transacao[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

// "24/10/2026" -> "Hoje · sexta-feira, 24 de outubro"
const dayLabel = (vencimento: string): string => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(vencimento || "");
  if (!match) return vencimento || "Sem vencimento";
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((date.getTime() - today.getTime()) / DAY_MS);
  const formatted = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
  const relative = diff === 0 ? "Hoje" : diff === 1 ? "Amanhã" : diff === -1 ? "Ontem" : null;
  return relative ? `${relative} · ${formatted}` : formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// Agrupa itens consecutivos com o mesmo vencimento. Só faz sentido com a lista ordenada por
// vencimento; em outra ordenação, a lista fica num grupo só, sem cabeçalho.
const groupByDay = (transacoes: Transacao[], sortBy: string): DayGroup[] => {
  if (sortBy !== "vencimento") {
    return [{ key: "todos", label: null, net: 0, items: transacoes }];
  }
  const groups: DayGroup[] = [];
  transacoes.forEach((t) => {
    const signed = t.tipo === "DESPESA" ? -Number(t.valor) : Number(t.valor);
    const last = groups[groups.length - 1];
    if (last && last.key === t.vencimento) {
      last.items.push(t);
      last.net += signed;
    } else {
      groups.push({ key: t.vencimento, label: dayLabel(t.vencimento), net: signed, items: [t] });
    }
  });
  return groups;
};

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

  const groups = groupByDay(transacoes, sortBy);

  return (
    <>
      {/* Visão Mobile: lista agrupada por dia de vencimento; tocar no item abre o detalhe */}
      <div className="-mx-4 -my-4 sm:hidden">
        {groups.map((group) => (
          <section key={group.key}>
            {group.label && (
              <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--app-border-subtle))] bg-[rgb(var(--app-bg-muted))] px-4 py-2 text-xs">
                <span className="font-medium text-[rgb(var(--app-text-secondary))]">{group.label}</span>
                {group.items.length > 1 && (
                  <span className={`font-semibold tabular-nums ${group.net < 0 ? "text-[rgb(var(--app-status-error-text))]" : "text-[rgb(var(--app-status-success-text))]"}`}>
                    {formatSignedCurrency(group.net, group.net < 0 ? "DESPESA" : "RECEITA")}
                  </span>
                )}
              </div>
            )}
            <ul>
              {group.items.map((transacao) => (
                <li
                  key={transacao.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onView(transacao)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onView(transacao);
                    }
                  }}
                  aria-label={`${transacao.descricao_nome || "Sem descrição"}, ${formatSignedCurrency(transacao.valor, transacao.tipo)}. Abrir detalhes`}
                  className="flex min-h-[64px] cursor-pointer items-center gap-3 border-b border-[rgb(var(--app-border-subtle))] px-4 py-3 transition-colors last:border-b-0 active:bg-[rgb(var(--app-bg-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--app-focus-ring))]"
                >
                  <CategoryIcon nome={transacao.categoria_nome || ""} tipo={transacao.tipo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[rgb(var(--app-text-primary))]">
                      {transacao.descricao_nome || "Sem descrição"}
                    </p>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-[rgb(var(--app-text-muted))]">
                      {transacao.banco_nome && <BankLogo nome={transacao.banco_nome} size="sm" />}
                      <span className="truncate">
                        {[transacao.categoria_nome, transacao.banco_nome].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <MoneyValue value={transacao.valor} tipo={transacao.tipo} className="text-sm" />
                    {/* A tag alterna a situação sem abrir o detalhe */}
                    <span onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                      <SituacaoBadge situacao={transacao.situacao} onToggle={() => onToggleSituacao(transacao)} />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
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
