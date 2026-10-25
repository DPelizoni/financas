"use client";

import { Transacao } from "@/types/transacao";
import MoneyValue from "@/components/MoneyValue";
import SituacaoBadge from "@/components/SituacaoBadge";
import SortableHeader from "@/components/SortableHeader";

interface DashboardTransactionsTableProps {
  detailedRows: Transacao[];
  tableSortBy: "mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor";
  tableSortDirection: "asc" | "desc";
  handleTableSort: (column: "mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor") => void;
  tipoLabel: Record<"DESPESA" | "RECEITA", string>;
}

export function DashboardTransactionsTable({
  detailedRows,
  tableSortBy,
  tableSortDirection,
  handleTableSort,
  tipoLabel,
}: DashboardTransactionsTableProps) {
  return (
    <div className="app-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-slate-300">
          Dados Detalhados
        </h3>
        <span className="text-xs text-app-text-muted dark:text-slate-500">
          Registros filtrados exibidos: {detailedRows.length}
        </span>
      </div>

      <div className="px-2 sm:px-0 md:hidden">
        <div className="space-y-3">
          {detailedRows.length === 0 ? (
            <div
              className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-app-text-muted dark:border-slate-700 dark:text-slate-500"
            >
              Nenhum registro encontrado com os filtros atuais.
            </div>
          ) : (
            detailedRows.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-gray-200/80 bg-gradient-to-b from-app-surface to-neutral-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {t.descricao_nome || "Sem descrição"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-700 dark:text-slate-400">{t.mes}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${
                      t.tipo === "RECEITA"
                        ? "bg-app-success-surface text-app-success-text dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-app-error-surface text-app-error-text dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {tipoLabel[t.tipo]}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-neutral-700 dark:text-slate-300">
                  <p>
                    <span className="font-medium">Categoria: </span>
                    {t.categoria_nome || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Banco: </span>
                    {t.banco_nome || "-"}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <SituacaoBadge situacao={t.situacao} />
                  <MoneyValue value={t.valor} tipo={t.tipo} className="text-sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="app-table-scroll hidden md:block">
        <table className="w-full table-fixed divide-y divide-neutral-200 text-xs dark:divide-slate-800">
          <thead className="app-table-head">
            <tr>
              <SortableHeader label="Mês" column="mes" sortBy={tableSortBy} sortDirection={tableSortDirection} onSort={handleTableSort} className="w-[10%]" />
              <SortableHeader label="Tipo" column="tipo" sortBy={tableSortBy} sortDirection={tableSortDirection} onSort={handleTableSort} align="center" className="w-[10%]" />
              <SortableHeader label="Categoria" column="categoria" sortBy={tableSortBy} sortDirection={tableSortDirection} onSort={handleTableSort} className="w-[18%]" />
              <th className="app-table-head-cell w-[22%] dark:text-slate-400">
                Descrição
              </th>
              <SortableHeader label="Banco" column="banco" sortBy={tableSortBy} sortDirection={tableSortDirection} onSort={handleTableSort} className="w-[18%]" />
              <SortableHeader label="Situação" column="situacao" sortBy={tableSortBy} sortDirection={tableSortDirection} onSort={handleTableSort} align="center" className="w-[12%]" />
              <SortableHeader label="Valor" column="valor" sortBy={tableSortBy} sortDirection={tableSortDirection} onSort={handleTableSort} align="right" className="w-[10%]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-app-surface dark:divide-slate-800 dark:bg-slate-900">
            {detailedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-xs text-app-text-muted dark:text-slate-500"
                >
                  Nenhum registro encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              detailedRows.map((t) => (
                <tr key={t.id} className="app-table-row">
                  <td className="px-3 py-2 text-xs text-neutral-700 dark:text-slate-300">
                    {t.mes}
                  </td>
                  <td className="px-3 py-2 text-xs text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${
                        t.tipo === "RECEITA"
                          ? "bg-app-success-surface text-app-success-text dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-app-error-surface text-app-error-text dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {tipoLabel[t.tipo]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-700 dark:text-slate-300">
                    <span
                      className="block truncate"
                      title={t.categoria_nome || "-"}
                    >
                      {t.categoria_nome || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-700 dark:text-slate-300">
                    <span
                      className="block truncate"
                      title={t.descricao_nome || "-"}
                    >
                      {t.descricao_nome || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-700 dark:text-slate-300">
                    <span
                      className="block truncate"
                      title={t.banco_nome || "-"}
                    >
                      {t.banco_nome || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-center">
                    <SituacaoBadge situacao={t.situacao} />
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    <MoneyValue value={t.valor} tipo={t.tipo} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
