"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  CheckCircle,
  XCircle,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { bankService, BankFilters } from "@/services/bankService";
import { Bank } from "@/types/bank";
import BankModal from "@/components/BankModal";
import Pagination from "@/components/Pagination";
import FeedbackAlert from "@/components/FeedbackAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageContainer from "@/components/PageContainer";
import { IconButton, InputAdornment, TextField } from "@mui/material";

export default function BanksPage() {
  const filterFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
    },
  };
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

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
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
            <button
              onClick={handleCreate}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 sm:w-auto"
            >
              <Plus size={20} />
              Novo Banco
            </button>
          </div>
        </PageContainer>

        {/* Filters */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <TextField
                type="text"
                label="Buscar"
                placeholder="Digitar..."
                variant="outlined"
                size="small"
                fullWidth
                sx={filterFieldSx}
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
              <button
                onClick={() => setFilterAtivo(undefined)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterAtivo === undefined
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterAtivo(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterAtivo === true
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setFilterAtivo(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterAtivo === false
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Inativos
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando dados...</p>
            </div>
          ) : banks.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nenhum registro encontrado</p>
              <button
                onClick={handleCreate}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Criar novo registro
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2 p-2 sm:p-3 md:hidden">
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                          <CheckCircle size={14} />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                          <XCircle size={14} />
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="mt-3 text-sm text-gray-700">
                      <span className="font-medium">Saldo Inicial: </span>
                      {formatCurrencyBRL(bank.saldo_inicial)}
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => handleEdit(bank)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(bank)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[640px] w-full divide-y divide-gray-200 text-xs">
                  <thead className="border-b bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleSort("nome")}
                          className="inline-flex items-center gap-1"
                        >
                          Banco
                          {sortBy === "nome" && sortDirection === "asc" ? (
                            <ChevronUp size={14} />
                          ) : sortBy === "nome" ? (
                            <ChevronDown size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleSort("codigo")}
                          className="inline-flex items-center gap-1"
                        >
                          Código
                          {sortBy === "codigo" && sortDirection === "asc" ? (
                            <ChevronUp size={14} />
                          ) : sortBy === "codigo" ? (
                            <ChevronDown size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleSort("saldo")}
                          className="inline-flex items-center gap-1"
                        >
                          Saldo Inicial
                          {sortBy === "saldo" && sortDirection === "asc" ? (
                            <ChevronUp size={14} />
                          ) : sortBy === "saldo" ? (
                            <ChevronDown size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleSort("status")}
                          className="inline-flex items-center gap-1"
                        >
                          Status
                          {sortBy === "status" && sortDirection === "asc" ? (
                            <ChevronUp size={14} />
                          ) : sortBy === "status" ? (
                            <ChevronDown size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedBanks.map((bank) => (
                      <tr
                        key={bank.id}
                        className="hover:bg-gray-50 transition-colors"
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                              <CheckCircle size={14} />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                              <XCircle size={14} />
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                          <button
                            onClick={() => handleEdit(bank)}
                            className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 transition hover:bg-blue-50 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(bank)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
            </>
          )}
        </div>
      </div>

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
