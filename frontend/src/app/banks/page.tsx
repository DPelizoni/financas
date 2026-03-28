"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Building2,
  X,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
import Icon from "@mdi/react";
import { mdiPlusBoxOutline } from "@mdi/js";
import { bankService, BankFilters } from "@/services/bankService";
import { Bank } from "@/types/bank";
import BankModal from "@/components/BankModal";
import Pagination from "@/components/Pagination";
import FeedbackAlert from "@/components/FeedbackAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { IconButton, InputAdornment, TextField } from "@mui/material";

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(
    undefined,
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null);
  const [viewingBank, setViewingBank] = useState<Bank | null>(null);
  const [sortBy, setSortBy] = useState<"nome" | "codigo" | "saldo" | "status">(
    "nome",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: "nome" | "codigo" | "saldo" | "status") => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDirection("asc");
  };

  const sortedBanks = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...banks].sort((a, b) => {
      if (sortBy === "nome") {
        return a.nome.localeCompare(b.nome, "pt-BR") * direction;
      }
      if (sortBy === "codigo") {
        return (
          (a.codigo || "").localeCompare(b.codigo || "", "pt-BR") * direction
        );
      }
      if (sortBy === "saldo") {
        return (Number(a.saldo_inicial) - Number(b.saldo_inicial)) * direction;
      }
      return Number(a.ativo === true) === Number(b.ativo === true)
        ? 0
        : (a.ativo ? 1 : -1) * direction;
    });
  }, [banks, sortBy, sortDirection]);

  const formatCurrencyBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const loadBanks = async () => {
    try {
      setLoading(true);
      const filters: BankFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        ativo: filterAtivo,
      };

      const response = await bankService.getAll(filters);
      setBanks(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
      showFeedback(
        "error",
        "Não foi possível carregar os bancos. Verifique a conexão com a API.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanks();
  }, [currentPage, searchTerm, filterAtivo, itemsPerPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDelete = (bank: Bank) => {
    setDeleteTarget(bank);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await bankService.delete(deleteTarget.id);
      showFeedback(
        "success",
        "Banco excluído com sucesso. A ação foi concluída.",
      );
      setDeleteTarget(null);
      await loadBanks();
    } catch (error) {
      console.error("Erro ao excluir banco:", error);
      const apiMessage = (error as any)?.response?.data?.message;
      showFeedback(
        "error",
        apiMessage || "Não foi possível excluir o banco. Tente novamente.",
      );
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setShowModal(true);
  };

  const handleView = (bank: Bank) => {
    setViewingBank(bank);
  };

  const handleCreate = () => {
    setEditingBank(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBank(null);
  };

  const handleSaveSuccess = async (message: string): Promise<void> => {
    showFeedback("success", message);
    await loadBanks();
    handleCloseModal();
  };

  const viewingBankData = viewingBank
    ? (() => {
        const { cor, icone, ...baseData } = viewingBank;
        return baseData;
      })()
    : null;

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                <Building2 size={32} className="text-blue-600" />
                Gerenciamento de Bancos
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gerencie suas instituições financeiras e contas
              </p>
            </div>
            <AppButton
              onClick={handleCreate}
              tone="primary"
              startIcon={<Icon path={mdiPlusBoxOutline} size={0.8} />}
              className="w-full sm:w-auto"
            >
              Novo Banco
            </AppButton>
          </div>
        </PageContainer>

        {/* Filters */}
        <div className="filter-panel-surface">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <TextField
                type="text"
                label="Buscar"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} className="text-gray-400" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleSearch("")}
                        aria-label="Limpar pesquisa"
                      >
                        <X size={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <AppButton
                onClick={() => setFilterAtivo(undefined)}
                tone={filterAtivo === undefined ? "primary" : "outline-primary"}
                size="sm"
              >
                Todos
              </AppButton>
              <AppButton
                onClick={() => setFilterAtivo(true)}
                tone={filterAtivo === true ? "success" : "outline-success"}
                size="sm"
              >
                Ativos
              </AppButton>
              <AppButton
                onClick={() => setFilterAtivo(false)}
                tone={filterAtivo === false ? "danger" : "outline-danger"}
                size="sm"
              >
                Inativos
              </AppButton>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="app-surface p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando dados...</p>
            </div>
          ) : banks.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum registro encontrado</p>
              <AppButton
                onClick={handleCreate}
                tone="ghost"
                size="sm"
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Criar novo registro
              </AppButton>
            </div>
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {sortedBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                          style={{ backgroundColor: bank.cor }}
                        >
                          {bank.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {bank.nome}
                          </p>
                          <p className="text-xs text-gray-600">
                            Código: {bank.codigo || "-"}
                          </p>
                        </div>
                      </div>
                      {bank.ativo ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="mt-3 text-sm text-gray-700">
                      <span className="font-medium">Saldo Inicial: </span>
                      {formatCurrencyBRL(bank.saldo_inicial)}
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                      <TableActionButton
                        action="view"
                        title="Visualizar"
                        onClick={() => handleView(bank)}
                      />
                      <TableActionButton
                        action="edit"
                        title="Editar"
                        onClick={() => handleEdit(bank)}
                      />
                      <TableActionButton
                        action="delete"
                        title="Excluir"
                        onClick={() => handleDelete(bank)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[640px] w-full divide-y divide-gray-200 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <th className="app-table-head-cell">
                        <button
                          type="button"
                          onClick={() => handleSort("nome")}
                          className="inline-flex items-center gap-1"
                        >
                          Banco
                          {sortBy === "nome" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "nome" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell">
                        <button
                          type="button"
                          onClick={() => handleSort("codigo")}
                          className="inline-flex items-center gap-1"
                        >
                          Código
                          {sortBy === "codigo" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "codigo" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell">
                        <button
                          type="button"
                          onClick={() => handleSort("saldo")}
                          className="inline-flex items-center gap-1"
                        >
                          Saldo Inicial
                          {sortBy === "saldo" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "saldo" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell">
                        <button
                          type="button"
                          onClick={() => handleSort("status")}
                          className="inline-flex items-center gap-1"
                        >
                          Status
                          {sortBy === "status" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "status" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell-center">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedBanks.map((bank) => (
                      <tr
                        key={bank.id}
                        className="app-table-row"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{ backgroundColor: bank.cor }}
                            >
                              {bank.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="text-xs font-medium text-gray-900">
                              {bank.nome}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {bank.codigo || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {formatCurrencyBRL(bank.saldo_inicial)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {bank.ativo ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center text-xs font-medium">
                          <div className="flex justify-center gap-1">
                            <TableActionButton
                              action="view"
                              title="Visualizar"
                              onClick={() => handleView(bank)}
                              compact
                            />
                            <TableActionButton
                              action="edit"
                              title="Editar"
                              onClick={() => handleEdit(bank)}
                              compact
                            />
                            <TableActionButton
                              action="delete"
                              title="Excluir"
                              onClick={() => handleDelete(bank)}
                              compact
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </>
          )}
        </div>

        {!loading && banks.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[5, 10, 20, 50, 100]}
            centeredLayout
          />
        )}
      </div>

      <ViewDataModal
        isOpen={!!viewingBank}
        title="Visualizar Banco"
        data={viewingBankData}
        onClose={() => setViewingBank(null)}
      />

      {/* Modal */}
      {showModal && (
        <BankModal
          bank={editingBank}
          onClose={handleCloseModal}
          onSave={handleSaveSuccess}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirmar exclusão"
        description={
          <>
            Esta ação removerá o banco <strong>{deleteTarget?.nome}</strong>.
          </>
        }
        confirmLabel="Excluir banco"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}


