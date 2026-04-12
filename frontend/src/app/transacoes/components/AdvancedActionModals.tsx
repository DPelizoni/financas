"use client";

import React from "react";
import { createPortal } from "react-dom";
import { TextField } from "@mui/material";
import { Copy, Plus, Trash, XCircle } from "lucide-react";
import AppButton from "@/components/AppButton";

interface AdvancedActionModalsProps {
  isPortalReady: boolean;
  
  // Copy by Month
  copyModalOpen: boolean;
  onCopyModalClose: () => void;
  copyMesOrigem: string;
  setCopyMesOrigem: (val: string) => void;
  copyMesDestinoInput: string;
  setCopyMesDestinoInput: (val: string) => void;
  copyMesesDestino: string[];
  onAddDestinoMes: () => void;
  onRemoveDestinoMes: (mes: string) => void;
  onAddNextMonths: (count: number) => void;
  onCopyByMonth: () => void;
  copyLoading: boolean;

  // Delete by Month
  deleteModalOpen: boolean;
  onDeleteModalClose: () => void;
  deleteMesInput: string;
  setDeleteMesInput: (val: string) => void;
  deleteMeses: string[];
  onAddDeleteMes: () => void;
  onRemoveDeleteMes: (mes: string) => void;
  onAddDeleteNextMonths: (count: number) => void;
  onRequestDeleteByMonths: () => void;
  deleteMonthsLoading: boolean;

  // Delete Transaction by Months
  deleteTransactionMonthsModalOpen: boolean;
  onDeleteTransactionMonthsModalClose: () => void;
  deleteTransactionMonthsTarget: { transacaoId: number; transacaoMes: string } | null;
  deleteTransactionMesInput: string;
  setDeleteTransactionMesInput: (val: string) => void;
  deleteTransactionMeses: string[];
  onAddDeleteTransactionMes: () => void;
  onRemoveDeleteTransactionMes: (mes: string) => void;
  onAddDeleteTransactionNextMonths: (count: number) => void;
  onRequestDeleteTransactionByMonths: () => void;
  deleteTransactionMonthsLoading: boolean;
  
  // Refs and IDs for accessibility
  copyModalRef: React.RefObject<HTMLDivElement>;
  copyModalTitleId: string;
  deleteModalRef: React.RefObject<HTMLDivElement>;
  deleteModalTitleId: string;
  deleteTransactionMonthsModalRef: React.RefObject<HTMLDivElement>;
  deleteTransactionMonthsModalTitleId: string;
  
  // Helpers
  monthApiToInput: (val: string) => string;
}

export function AdvancedActionModals({
  isPortalReady,
  copyModalOpen,
  onCopyModalClose,
  copyMesOrigem,
  setCopyMesOrigem,
  copyMesDestinoInput,
  setCopyMesDestinoInput,
  copyMesesDestino,
  onAddDestinoMes,
  onRemoveDestinoMes,
  onAddNextMonths,
  onCopyByMonth,
  copyLoading,
  deleteModalOpen,
  onDeleteModalClose,
  deleteMesInput,
  setDeleteMesInput,
  deleteMeses,
  onAddDeleteMes,
  onRemoveDeleteMes,
  onAddDeleteNextMonths,
  onRequestDeleteByMonths,
  deleteMonthsLoading,
  deleteTransactionMonthsModalOpen,
  onDeleteTransactionMonthsModalClose,
  deleteTransactionMonthsTarget,
  deleteTransactionMesInput,
  setDeleteTransactionMesInput,
  deleteTransactionMeses,
  onAddDeleteTransactionMes,
  onRemoveDeleteTransactionMes,
  onAddDeleteTransactionNextMonths,
  onRequestDeleteTransactionByMonths,
  deleteTransactionMonthsLoading,
  copyModalRef,
  copyModalTitleId,
  deleteModalRef,
  deleteModalTitleId,
  deleteTransactionMonthsModalRef,
  deleteTransactionMonthsModalTitleId,
  monthApiToInput,
}: AdvancedActionModalsProps) {
  if (!isPortalReady) return null;

  return (
    <>
      {/* Copy by Month Modal */}
      {copyModalOpen && createPortal(
        <div className="app-modal-overlay">
          <div
            ref={copyModalRef}
            className="app-modal-content w-full max-w-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={copyModalTitleId}
            tabIndex={-1}
          >
            <div className="app-modal-header">
              <h3
                id={copyModalTitleId}
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                Copiar Transações por Mês
              </h3>
            </div>

            <div className="space-y-6 p-6">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Selecione um mês de origem e um ou mais meses de destino para
                replicar todos os lançamentos.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  type="month"
                  label="Mês de Origem"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={copyMesOrigem}
                  onChange={(e) => setCopyMesOrigem(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <div className="flex gap-2">
                  <TextField
                    type="month"
                    label="Adicionar Mês de Destino"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={copyMesDestinoInput}
                    onChange={(e) => setCopyMesDestinoInput(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <button
                    type="button"
                    onClick={onAddDestinoMes}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    title="Adicionar mês"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">
                  Atalhos para Destino
                </p>
                <div className="flex flex-wrap gap-2">
                  {[3, 6, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onAddNextMonths(n)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Plus size={14} />
                      Próximos {n} meses
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-[60px] rounded-lg border border-dashed border-gray-200 p-3 dark:border-slate-800">
                <p className="mb-2 text-xs font-medium text-gray-500 dark:text-slate-500">
                  Meses de destino selecionados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {copyMesesDestino.length === 0 ? (
                    <span className="text-xs italic text-gray-400 dark:text-slate-600">
                      Nenhum mês selecionado
                    </span>
                  ) : (
                    copyMesesDestino.map((mes) => (
                      <span
                        key={mes}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                      >
                        {monthApiToInput(mes)}
                        <button
                          type="button"
                          onClick={() => onRemoveDestinoMes(mes)}
                          className="rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          <XCircle size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="app-modal-footer mt-6">
              <AppButton
                type="button"
                onClick={onCopyModalClose}
                tone="outline-danger"
                size="sm"
              >
                Cancelar
              </AppButton>
              <AppButton
                type="button"
                onClick={onCopyByMonth}
                disabled={copyLoading || copyMesesDestino.length === 0}
                tone="primary"
                size="sm"
                startIcon={copyLoading ? undefined : <Copy size={16} />}
              >
                {copyLoading ? "Copiando..." : "Executar Cópia"}
              </AppButton>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete by Month Modal */}
      {deleteModalOpen && createPortal(
        <div className="app-modal-overlay">
          <div
            ref={deleteModalRef}
            className="app-modal-content w-full max-w-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteModalTitleId}
            tabIndex={-1}
          >
            <div className="app-modal-header">
              <h3
                id={deleteModalTitleId}
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                Excluir Transações por Mês
              </h3>
            </div>

            <div className="space-y-6 p-6">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Selecione um ou mais meses para excluir permanentemente todos os
                lançamentos.
              </p>

              <div className="flex gap-2">
                <TextField
                  type="month"
                  label="Selecionar Mês para Exclusão"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={deleteMesInput}
                  onChange={(e) => setDeleteMesInput(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <button
                  type="button"
                  onClick={onAddDeleteMes}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50"
                  title="Adicionar mês"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">
                  Atalhos para Exclusão
                </p>
                <div className="flex flex-wrap gap-2">
                  {[3, 6, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onAddDeleteNextMonths(n)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Plus size={14} />
                      Incluir próximos {n} meses
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-[60px] rounded-lg border border-dashed border-red-200 p-3 dark:border-red-900/30">
                <p className="mb-2 text-xs font-medium text-red-700 dark:text-red-400">
                  Meses marcados para exclusão:
                </p>
                <div className="flex flex-wrap gap-2">
                  {deleteMeses.length === 0 ? (
                    <span className="text-xs italic text-gray-400 dark:text-slate-600">
                      Nenhum mês selecionado
                    </span>
                  ) : (
                    deleteMeses.map((mes) => (
                      <span
                        key={mes}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                      >
                        {monthApiToInput(mes)}
                        <button
                          type="button"
                          onClick={() => onRemoveDeleteMes(mes)}
                          className="rounded-full hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          <XCircle size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="app-modal-footer mt-6">
              <AppButton
                type="button"
                onClick={onDeleteModalClose}
                tone="outline"
                size="sm"
              >
                Cancelar
              </AppButton>
              <AppButton
                type="button"
                onClick={onRequestDeleteByMonths}
                disabled={deleteMonthsLoading || deleteMeses.length === 0}
                tone="danger"
                size="sm"
                startIcon={deleteMonthsLoading ? undefined : <Trash size={16} />}
              >
                {deleteMonthsLoading ? "Excluindo..." : "Excluir Meses Selecionados"}
              </AppButton>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Transaction by Months Modal */}
      {deleteTransactionMonthsModalOpen && createPortal(
        <div className="app-modal-overlay">
          <div
            ref={deleteTransactionMonthsModalRef}
            className="app-modal-content w-full max-w-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteTransactionMonthsModalTitleId}
            tabIndex={-1}
          >
            <div className="app-modal-header border-b border-red-100 bg-red-50/50 dark:bg-red-900/20 dark:border-red-900/30">
              <h3
                id={deleteTransactionMonthsModalTitleId}
                className="text-lg font-bold text-red-900 dark:text-red-400"
              >
                Excluir Lançamento em Lote
              </h3>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400">
                Você está prestes a remover o lançamento base do mês{" "}
                <strong>{deleteTransactionMonthsTarget?.transacaoMes}</strong>{" "}
                e suas réplicas nos meses selecionados abaixo.
              </div>

              <div className="flex gap-2">
                <TextField
                  type="month"
                  label="Adicionar mês para remover"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={deleteTransactionMesInput}
                  onChange={(e) => setDeleteTransactionMesInput(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <button
                  type="button"
                  onClick={onAddDeleteTransactionMes}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">
                  Atalhos
                </p>
                <div className="flex flex-wrap gap-2">
                  {[3, 6, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onAddDeleteTransactionNextMonths(n)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Plus size={14} />
                      + {n} meses
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-[60px] rounded-lg border border-dashed border-red-200 p-3 dark:border-red-900/30">
                <div className="flex flex-wrap gap-2">
                  {deleteTransactionMeses.length === 0 ? (
                    <span className="text-xs italic text-gray-400 dark:text-slate-600">
                      Selecione os meses que deseja limpar
                    </span>
                  ) : (
                    deleteTransactionMeses.map((mes) => (
                      <span
                        key={mes}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                      >
                        {monthApiToInput(mes)}
                        <button
                          type="button"
                          onClick={() => onRemoveDeleteTransactionMes(mes)}
                          className="rounded-full hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          <XCircle size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="app-modal-footer mt-6">
              <AppButton
                type="button"
                onClick={onDeleteTransactionMonthsModalClose}
                tone="outline"
                size="sm"
              >
                Cancelar
              </AppButton>
              <AppButton
                type="button"
                onClick={onRequestDeleteTransactionByMonths}
                disabled={
                  deleteTransactionMonthsLoading ||
                  deleteTransactionMeses.length === 0
                }
                tone="danger"
                size="sm"
                startIcon={
                  deleteTransactionMonthsLoading ? undefined : <Trash size={16} />
                }
              >
                {deleteTransactionMonthsLoading
                  ? "Excluindo..."
                  : "Confirmar Exclusão"}
              </AppButton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
