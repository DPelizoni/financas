"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { Transacao } from "@/types/transacao";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardTransactionsTableProps {
  detailedRows: Transacao[];
  tableSortBy: "mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor";
  tableSortDirection: "asc" | "desc";
  handleTableSort: (column: "mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor") => void;
  tipoLabel: Record<"DESPESA" | "RECEITA", string>;
  situacaoLabel: Record<"PENDENTE" | "PAGO", string>;
  currency: (value: number) => string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function DashboardTransactionsTable({
  detailedRows,
  tableSortBy,
  tableSortDirection,
  handleTableSort,
  tipoLabel,
  situacaoLabel,
  currency,
}: DashboardTransactionsTableProps) {
  return (
    <div className="app-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          Dados Detalhados
        </h3>
        <span className="text-xs text-gray-500 dark:text-slate-500">
          Registros filtrados exibidos: {detailedRows.length}
        </span>
      </div>

      <div className="px-2 sm:px-0 md:hidden">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {detailedRows.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-500"
              >
                Nenhum registro encontrado com os filtros atuais.
              </motion.div>
            ) : (
              detailedRows.map((t) => (
                <motion.div
                  key={t.id}
                  variants={itemVariants}
                  layout
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t.descricao_nome || "Sem descrição"}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">{t.mes}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                        t.tipo === "RECEITA"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {tipoLabel[t.tipo]}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300">
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
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                        t.situacao === "PAGO"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {situacaoLabel[t.situacao]}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {currency(Number(t.valor))}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed divide-y divide-gray-200 text-xs dark:divide-slate-800">
          <thead className="app-table-head">
            <tr>
              <th className="app-table-head-cell w-[10%]">
                <button
                  type="button"
                  onClick={() => handleTableSort("mes")}
                  className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Mês
                  {tableSortBy === "mes" && tableSortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} className="text-blue-600" />
                  ) : tableSortBy === "mes" ? (
                    <ArrowDownWideNarrow size={14} className="text-blue-600" />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[10%]">
                <button
                  type="button"
                  onClick={() => handleTableSort("tipo")}
                  className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Tipo
                  {tableSortBy === "tipo" &&
                  tableSortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} className="text-blue-600" />
                  ) : tableSortBy === "tipo" ? (
                    <ArrowDownWideNarrow size={14} className="text-blue-600" />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[18%]">
                <button
                  type="button"
                  onClick={() => handleTableSort("categoria")}
                  className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Categoria
                  {tableSortBy === "categoria" &&
                  tableSortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} className="text-blue-600" />
                  ) : tableSortBy === "categoria" ? (
                    <ArrowDownWideNarrow size={14} className="text-blue-600" />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[22%] dark:text-slate-400">
                Descrição
              </th>
              <th className="app-table-head-cell w-[18%]">
                <button
                  type="button"
                  onClick={() => handleTableSort("banco")}
                  className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Banco
                  {tableSortBy === "banco" &&
                  tableSortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} className="text-blue-600" />
                  ) : tableSortBy === "banco" ? (
                    <ArrowDownWideNarrow size={14} className="text-blue-600" />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell w-[12%]">
                <button
                  type="button"
                  onClick={() => handleTableSort("situacao")}
                  className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Situação
                  {tableSortBy === "situacao" &&
                  tableSortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} className="text-blue-600" />
                  ) : tableSortBy === "situacao" ? (
                    <ArrowDownWideNarrow size={14} className="text-blue-600" />
                  ) : null}
                </button>
              </th>
              <th className="app-table-head-cell-right w-[10%]">
                <button
                  type="button"
                  onClick={() => handleTableSort("valor")}
                  className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  Valor
                  {tableSortBy === "valor" &&
                  tableSortDirection === "asc" ? (
                    <ArrowUpNarrowWide size={14} className="text-blue-600" />
                  ) : tableSortBy === "valor" ? (
                    <ArrowDownWideNarrow size={14} className="text-blue-600" />
                  ) : null}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            <AnimatePresence mode="popLayout">
              {detailedRows.length === 0 ? (
                <motion.tr
                  key="empty-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-xs text-gray-500 dark:text-slate-500"
                  >
                    Nenhum registro encontrado com os filtros atuais.
                  </td>
                </motion.tr>
              ) : (
                detailedRows.map((t) => (
                  <motion.tr 
                    key={t.id} 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="app-table-row"
                  >
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300">
                      {t.mes}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                          t.tipo === "RECEITA"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {tipoLabel[t.tipo]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300">
                      <span
                        className="block truncate"
                        title={t.categoria_nome || "-"}
                      >
                        {t.categoria_nome || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300">
                      <span
                        className="block truncate"
                        title={t.descricao_nome || "-"}
                      >
                        {t.descricao_nome || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300">
                      <span
                        className="block truncate"
                        title={t.banco_nome || "-"}
                      >
                        {t.banco_nome || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                          t.situacao === "PAGO"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {situacaoLabel[t.situacao]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      {currency(Number(t.valor))}
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
