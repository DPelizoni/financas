"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Transacao,
  TransacaoFilters,
  TransacaoSummary,
  CopyMonthResult,
  DeleteMonthsResult,
} from "@/types/transacao";
import { Category } from "@/types/category";
import { Bank } from "@/types/bank";
import { transacaoService } from "@/services/transacaoService";
import { categoryService } from "@/services/categoryService";
import { bankService } from "@/services/bankService";
import { TransacaoModal } from "@/components/TransacaoModal";
import Pagination from "@/components/Pagination";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowLeftRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import FeedbackAlert from "@/components/FeedbackAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

interface DeleteConfirmation {
  isOpen: boolean;
  transacaoId: number | null;
  transacaoMes: string | null;
}

interface FeedbackMessage {
  type: "success" | "error";
  message: string;
}

const monthInputToApi = (value: string): string | undefined => {
  if (!value) return undefined;
  const [year, month] = value.split("-");
  if (!year || !month) return undefined;
  return `${month}/${year}`;
};

const monthApiToInput = (value: string): string => {
  if (/^\d{2}\/\d{4}$/.test(value)) {
    const [month, year] = value.split("/");
    return `${year}-${month}`;
  }
  return "";
};

const addMonthsToApiMonth = (apiMonth: string, offset: number): string => {
  const [monthStr, yearStr] = apiMonth.split("/");
  const month = Number(monthStr);
  const year = Number(yearStr);
  const date = new Date(year, month - 1 + offset, 1);
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextYear = String(date.getFullYear());
  return `${nextMonth}/${nextYear}`;
};

export default function TransacoesPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TransacaoSummary | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<"DESPESA" | "RECEITA" | "">("");
  const [filterCategoria, setFilterCategoria] = useState<number | "">("");
  const [filterBanco, setFilterBanco] = useState<number | "">("");
  const [filterSituacao, setFilterSituacao] = useState<
    "PENDENTE" | "PAGO" | ""
  >("");
  const [filterMes, setFilterMes] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao>();

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation>({
    isOpen: false,
    transacaoId: null,
    transacaoMes: null,
  });
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [sortBy, setSortBy] = useState<
    | "mes"
    | "vencimento"
    | "tipo"
    | "categoria"
    | "descricao"
    | "banco"
    | "valor"
    | "situacao"
  >("mes");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [copyMesOrigem, setCopyMesOrigem] = useState("");
  const [copyMesDestinoInput, setCopyMesDestinoInput] = useState("");
  const [copyMesesDestino, setCopyMesesDestino] = useState<string[]>([]);
  const [copyLoading, setCopyLoading] = useState(false);
  const [deleteMesInput, setDeleteMesInput] = useState("");
  const [deleteMeses, setDeleteMeses] = useState<string[]>([]);
  const [deleteMonthsLoading, setDeleteMonthsLoading] = useState(false);
  const [deleteMonthsConfirmOpen, setDeleteMonthsConfirmOpen] = useState(false);

  const handleSort = (
    column:
      | "mes"
      | "vencimento"
      | "tipo"
      | "categoria"
      | "descricao"
      | "banco"
      | "valor"
      | "situacao",
  ) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDirection("asc");
  };

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load transacoes when filters change
  useEffect(() => {
    loadTransacoes();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    filterTipo,
    filterCategoria,
    filterBanco,
    filterSituacao,
    filterMes,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCategories(), loadBanks()]);
      loadTransacoes();
    } finally {
      setLoading(false);
    }
  };

  const loadTransacoes = async () => {
    try {
      const filters: TransacaoFilters = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchTerm) filters.search = searchTerm;
      if (filterTipo) filters.tipo = filterTipo;
      if (filterCategoria) filters.categoria_id = filterCategoria as number;
      if (filterBanco) filters.banco_id = filterBanco as number;
      if (filterSituacao) filters.situacao = filterSituacao;
      const mesApi = monthInputToApi(filterMes);
      if (mesApi) filters.mes = mesApi;

      const response = await transacaoService.getAll(filters);
      setTransacoes(response.data || []);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);

      // Load summary
      const summaryResponse = await transacaoService.getSummary({
        search: searchTerm || undefined,
        tipo: filterTipo || undefined,
        categoria_id: filterCategoria ? (filterCategoria as number) : undefined,
        banco_id: filterBanco ? (filterBanco as number) : undefined,
        situacao: filterSituacao || undefined,
        mes: mesApi,
      });
      setSummary(summaryResponse);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
      showFeedback("error", "Não foi possível carregar as transações.");
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll({ limit: 999 });
      setCategories(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const loadBanks = async () => {
    try {
      const response = await bankService.getAll({ limit: 999 });
      setBanks(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
    }
  };

  const handleEdit = (transacao: Transacao) => {
    setEditingTransacao(transacao);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, mes: string) => {
    setDeleteConfirm({
      isOpen: true,
      transacaoId: id,
      transacaoMes: mes,
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.transacaoId) {
      try {
        await transacaoService.delete(deleteConfirm.transacaoId);
        setDeleteConfirm({
          isOpen: false,
          transacaoId: null,
          transacaoMes: null,
        });
        showFeedback("success", "Transação excluída com sucesso.");
        loadTransacoes();
      } catch (error) {
        console.error("Erro ao deletar transação:", error);
        const apiMessage = (error as any)?.response?.data?.message;
        showFeedback(
          "error",
          apiMessage || "Não foi possível excluir a transação.",
        );
      }
    }
  };

  const handleToggleSituacao = async (transacao: Transacao) => {
    try {
      const novaSituacao = transacao.situacao === "PAGO" ? "PENDENTE" : "PAGO";
      await transacaoService.update(transacao.id, { situacao: novaSituacao });
      showFeedback("success", `Transação marcada como ${novaSituacao}.`);
      loadTransacoes();
    } catch (error) {
      console.error("Erro ao atualizar situação:", error);
      showFeedback("error", "Não foi possível atualizar a situação.");
    }
  };

  const getCategoryNameById = (id: number) => {
    return categories.find((c) => c.id === id)?.nome || "-";
  };

  const getBankNameById = (id: number) => {
    return banks.find((b) => b.id === id)?.nome || "-";
  };

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [categories],
  );

  const sortedBanks = useMemo(
    () => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [banks],
  );

  const sortedTransacoes = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;

    return [...transacoes].sort((a, b) => {
      if (sortBy === "mes")
        return a.mes.localeCompare(b.mes, "pt-BR") * direction;
      if (sortBy === "vencimento")
        return a.vencimento.localeCompare(b.vencimento, "pt-BR") * direction;
      if (sortBy === "tipo")
        return a.tipo.localeCompare(b.tipo, "pt-BR") * direction;
      if (sortBy === "categoria")
        return (
          (a.categoria_nome || "").localeCompare(
            b.categoria_nome || "",
            "pt-BR",
          ) * direction
        );
      if (sortBy === "descricao")
        return (
          (a.descricao_nome || "").localeCompare(
            b.descricao_nome || "",
            "pt-BR",
          ) * direction
        );
      if (sortBy === "banco")
        return (
          (a.banco_nome || "").localeCompare(b.banco_nome || "", "pt-BR") *
          direction
        );
      if (sortBy === "valor")
        return (Number(a.valor) - Number(b.valor)) * direction;
      return a.situacao.localeCompare(b.situacao, "pt-BR") * direction;
    });
  }, [transacoes, sortBy, sortDirection]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleAddDestinoMes = () => {
    const mesApi = monthInputToApi(copyMesDestinoInput);
    if (!mesApi) {
      showFeedback("error", "Selecione um mês de destino válido.");
      return;
    }

    setCopyMesesDestino((prev) => {
      if (prev.includes(mesApi)) return prev;
      return [...prev, mesApi].sort((a, b) => {
        const [ma, ya] = a.split("/");
        const [mb, yb] = b.split("/");
        return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
      });
    });
    setCopyMesDestinoInput("");
  };

  const handleRemoveDestinoMes = (mes: string) => {
    setCopyMesesDestino((prev) => prev.filter((item) => item !== mes));
  };

  const handleAddNextMonths = (count: number) => {
    const origemApi = monthInputToApi(copyMesOrigem);
    if (!origemApi) {
      showFeedback("error", "Selecione o mês de origem para usar o atalho.");
      return;
    }

    const generated = Array.from({ length: count }, (_, index) =>
      addMonthsToApiMonth(origemApi, index + 1),
    );

    setCopyMesesDestino((prev) => {
      const merged = Array.from(new Set([...prev, ...generated]));
      return merged.sort((a, b) => {
        const [ma, ya] = a.split("/");
        const [mb, yb] = b.split("/");
        return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
      });
    });
  };

  const handleCopyByMonth = async () => {
    const origemApi = monthInputToApi(copyMesOrigem);
    if (!origemApi) {
      showFeedback("error", "Selecione o mês de origem.");
      return;
    }

    if (copyMesesDestino.length === 0) {
      showFeedback("error", "Adicione ao menos um mês de destino.");
      return;
    }

    const destinoSemOrigem = copyMesesDestino.filter((m) => m !== origemApi);
    if (destinoSemOrigem.length === 0) {
      showFeedback(
        "error",
        "O mês de destino deve ser diferente do mês de origem.",
      );
      return;
    }

    try {
      setCopyLoading(true);
      const result: CopyMonthResult = await transacaoService.copyByMonth({
        mes_origem: origemApi,
        meses_destino: destinoSemOrigem,
      });

      showFeedback(
        "success",
        `Cópia concluída: ${result.total_criadas} transações criadas para ${result.meses_destino.length} mês(es) de destino.`,
      );

      setCopyMesesDestino([]);
      setCopyMesDestinoInput("");
      setCurrentPage(1);
      await loadTransacoes();
    } catch (error) {
      const apiMessage = (error as any)?.response?.data?.message;
      showFeedback(
        "error",
        apiMessage || "Não foi possível copiar as transações por mês.",
      );
    } finally {
      setCopyLoading(false);
    }
  };

  const handleAddDeleteMes = () => {
    const mesApi = monthInputToApi(deleteMesInput);
    if (!mesApi) {
      showFeedback("error", "Selecione um mês válido para exclusão.");
      return;
    }

    setDeleteMeses((prev) => {
      if (prev.includes(mesApi)) return prev;
      return [...prev, mesApi].sort((a, b) => {
        const [ma, ya] = a.split("/");
        const [mb, yb] = b.split("/");
        return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
      });
    });
    setDeleteMesInput("");
  };

  const handleRemoveDeleteMes = (mes: string) => {
    setDeleteMeses((prev) => prev.filter((item) => item !== mes));
  };

  const handleAddDeleteNextMonths = (count: number) => {
    const baseMesApi = monthInputToApi(deleteMesInput);
    if (!baseMesApi) {
      showFeedback(
        "error",
        "Para usar este atalho, selecione o mês na rotina de exclusão.",
      );
      return;
    }

    const generated = Array.from({ length: count }, (_, index) =>
      addMonthsToApiMonth(baseMesApi, index),
    );

    setDeleteMeses((prev) => {
      const merged = Array.from(new Set([...prev, ...generated]));
      return merged.sort((a, b) => {
        const [ma, ya] = a.split("/");
        const [mb, yb] = b.split("/");
        return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
      });
    });
  };

  const handleDeleteByMonths = async () => {
    if (deleteMeses.length === 0) {
      showFeedback("error", "Adicione ao menos um mês para exclusão.");
      return;
    }

    try {
      setDeleteMonthsLoading(true);
      const result: DeleteMonthsResult = await transacaoService.deleteByMonths({
        meses: deleteMeses,
      });

      showFeedback(
        "success",
        `Exclusão concluída: ${result.total_excluidas} transações removidas em ${result.meses.length} mês(es).`,
      );

      setDeleteMeses([]);
      setDeleteMesInput("");
      setCurrentPage(1);
      await loadTransacoes();
    } catch (error) {
      const apiMessage = (error as any)?.response?.data?.message;
      showFeedback(
        "error",
        apiMessage || "Não foi possível excluir as transações por mês.",
      );
    } finally {
      setDeleteMonthsLoading(false);
    }
  };

  const requestDeleteByMonths = () => {
    if (deleteMeses.length === 0) {
      showFeedback("error", "Adicione ao menos um mês para exclusão.");
      return;
    }

    setDeleteMonthsConfirmOpen(true);
  };

  const formatCurrency = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                <ArrowLeftRight size={32} className="text-blue-600" />
                Gerenciamento de Transações
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Controle seus lançamentos de receitas e despesas
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTransacao(undefined);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Plus size={20} />
              Nova Transação
            </button>
          </div>
        </div>

        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Receita</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.total_receita)}
                  </p>
                </div>
                <ArrowLeftRight size={32} className="text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Despesa</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.total_despesa)}
                  </p>
                </div>
                <ArrowLeftRight size={32} className="text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Líquido</p>
                  <p
                    className={`text-2xl font-bold ${
                      summary.total_liquido >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summary.total_liquido)}
                  </p>
                </div>
                <DollarSign
                  size={32}
                  className={
                    summary.total_liquido >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pago - Receita</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summary.pago_receita)}
                  </p>
                </div>
                <CheckCircle2 size={32} className="text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pago - Despesa</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summary.pago_despesa)}
                  </p>
                </div>
                <CheckCircle2 size={32} className="text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pago - Líquido</p>
                  <p
                    className={`text-2xl font-bold ${
                      summary.pago_liquido >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summary.pago_liquido)}
                  </p>
                </div>
                <DollarSign
                  size={32}
                  className={
                    summary.pago_liquido >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Provisão Receita</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(summary.provisao_receita)}
                  </p>
                </div>
                <AlertCircle size={32} className="text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Provisão Despesa</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(summary.provisao_despesa)}
                  </p>
                </div>
                <AlertCircle size={32} className="text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Provisão Líquido</p>
                  <p
                    className={`text-2xl font-bold ${
                      summary.provisao_liquido >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summary.provisao_liquido)}
                  </p>
                </div>
                <DollarSign
                  size={32}
                  className={
                    summary.provisao_liquido >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-4 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-blue-900">
              Copiar Transações Por Mês
            </h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-blue-900">
                  Mês origem
                </label>
                <input
                  type="month"
                  value={copyMesOrigem}
                  onChange={(e) => setCopyMesOrigem(e.target.value)}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-blue-900">
                  Mês destino
                </label>
                <input
                  type="month"
                  value={copyMesDestinoInput}
                  onChange={(e) => setCopyMesDestinoInput(e.target.value)}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddDestinoMes}
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  Adicionar destino
                </button>
              </div>

              <div className="lg:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleCopyByMonth}
                  disabled={copyLoading}
                  className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copyLoading
                    ? "Copiando..."
                    : "Copiar para meses selecionados"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddNextMonths(3)}
                className="rounded-lg border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              >
                + 3 meses
              </button>
              <button
                type="button"
                onClick={() => handleAddNextMonths(6)}
                className="rounded-lg border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              >
                + 6 meses
              </button>
              <button
                type="button"
                onClick={() => handleAddNextMonths(12)}
                className="rounded-lg border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              >
                + 12 meses
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {copyMesesDestino.length === 0 ? (
                <span className="text-xs text-blue-800">
                  Nenhum mês de destino selecionado.
                </span>
              ) : (
                copyMesesDestino.map((mes) => (
                  <button
                    key={mes}
                    type="button"
                    onClick={() => handleRemoveDestinoMes(mes)}
                    className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100"
                    title="Remover mês destino"
                  >
                    {monthApiToInput(mes)} ×
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-dashed border-red-200 bg-red-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-red-900">
              Excluir Transações Por Mês
            </h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-red-900">
                  Mês para excluir
                </label>
                <input
                  type="month"
                  value={deleteMesInput}
                  onChange={(e) => setDeleteMesInput(e.target.value)}
                  className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddDeleteMes}
                  className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                >
                  Adicionar mês
                </button>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={requestDeleteByMonths}
                  disabled={deleteMonthsLoading}
                  className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 lg:col-span-3"
                >
                  {deleteMonthsLoading
                    ? "Excluindo..."
                    : "Excluir meses selecionados"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddDeleteNextMonths(3)}
                className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
              >
                + 3 meses
              </button>
              <button
                type="button"
                onClick={() => handleAddDeleteNextMonths(6)}
                className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
              >
                + 6 meses
              </button>
              <button
                type="button"
                onClick={() => handleAddDeleteNextMonths(12)}
                className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
              >
                + 12 meses
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {deleteMeses.length === 0 ? (
                <span className="text-xs text-red-800">
                  Nenhum mês selecionado para exclusão.
                </span>
              ) : (
                deleteMeses.map((mes) => (
                  <button
                    key={`delete-${mes}`}
                    type="button"
                    onClick={() => handleRemoveDeleteMes(mes)}
                    className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
                    title="Remover mês"
                  >
                    {monthApiToInput(mes)} ×
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={filterTipo}
                onChange={(e) => {
                  setFilterTipo(e.target.value as any);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="DESPESA">Despesa</option>
                <option value="RECEITA">Receita</option>
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={filterCategoria}
                onChange={(e) => {
                  setFilterCategoria(
                    e.target.value ? Number(e.target.value) : "",
                  );
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Todas</option>
                {sortedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Banco */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banco
              </label>
              <select
                value={filterBanco}
                onChange={(e) => {
                  setFilterBanco(e.target.value ? Number(e.target.value) : "");
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Todos</option>
                {sortedBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Mês */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês
              </label>
              <input
                type="month"
                value={filterMes}
                onChange={(e) => {
                  setFilterMes(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Situação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Situação
              </label>
              <select
                value={filterSituacao}
                onChange={(e) => {
                  setFilterSituacao(e.target.value as any);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Todas</option>
                <option value="PAGO">Pago</option>
                <option value="PENDENTE">Pendente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("mes")}
                      className="inline-flex items-center gap-1"
                    >
                      Mês
                      {sortBy === "mes" && sortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : sortBy === "mes" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("vencimento")}
                      className="inline-flex items-center gap-1"
                    >
                      Vencimento
                      {sortBy === "vencimento" && sortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : sortBy === "vencimento" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("tipo")}
                      className="inline-flex items-center gap-1"
                    >
                      Tipo
                      {sortBy === "tipo" && sortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : sortBy === "tipo" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("categoria")}
                      className="inline-flex items-center gap-1"
                    >
                      Categoria
                      {sortBy === "categoria" && sortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : sortBy === "categoria" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("descricao")}
                      className="inline-flex items-center gap-1"
                    >
                      Descrição
                      {sortBy === "descricao" && sortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : sortBy === "descricao" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("banco")}
                      className="inline-flex items-center gap-1"
                    >
                      Banco
                      {sortBy === "banco" && sortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : sortBy === "banco" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("valor")}
                      className="inline-flex items-center gap-1"
                    >
                      Valor
                      {sortBy === "valor" && sortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : sortBy === "valor" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("situacao")}
                      className="inline-flex items-center gap-1"
                    >
                      Situação
                      {sortBy === "situacao" && sortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : sortBy === "situacao" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transacoes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span>Nenhum registro encontrado</span>
                        <button
                          onClick={() => {
                            setEditingTransacao(undefined);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Criar novo registro
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedTransacoes.map((transacao) => (
                    <tr key={transacao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {transacao.mes}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transacao.vencimento}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            transacao.tipo === "DESPESA"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transacao.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transacao.categoria_nome || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transacao.descricao_nome || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transacao.banco_nome || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right">
                        {formatCurrency(transacao.valor)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleSituacao(transacao)}
                          className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                            transacao.situacao === "PAGO"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                        >
                          {transacao.situacao}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(transacao)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(transacao.id, transacao.mes)
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />

        {/* Modal */}
        <TransacaoModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransacao(undefined);
          }}
          onSuccess={(message) => {
            showFeedback("success", message);
            loadTransacoes();
          }}
          transacao={editingTransacao}
          isEditing={!!editingTransacao}
        />

        <ConfirmDeleteModal
          isOpen={deleteConfirm.isOpen}
          title="Confirmar exclusão"
          description={
            <>
              Esta ação removerá a transação do mês{" "}
              <strong>{deleteConfirm.transacaoMes}</strong>.
            </>
          }
          confirmLabel="Excluir transação"
          onCancel={() =>
            setDeleteConfirm({
              isOpen: false,
              transacaoId: null,
              transacaoMes: null,
            })
          }
          onConfirm={confirmDelete}
        />

        <ConfirmDeleteModal
          isOpen={deleteMonthsConfirmOpen}
          title="Confirmar exclusão por meses"
          description={
            deleteMeses.length === 1 ? (
              <>
                Esta ação removerá todas as transações do mês{" "}
                <strong>{deleteMeses[0]}</strong>.
              </>
            ) : (
              <>
                Esta ação removerá todas as transações de{" "}
                <strong>{deleteMeses.length} meses</strong> selecionados.
              </>
            )
          }
          confirmLabel="Excluir transações"
          onCancel={() => setDeleteMonthsConfirmOpen(false)}
          onConfirm={async () => {
            setDeleteMonthsConfirmOpen(false);
            await handleDeleteByMonths();
          }}
        />
      </div>
    </div>
  );
}
