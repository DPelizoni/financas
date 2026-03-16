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
  getTransactionSectionClasses,
  TransactionSection,
  TransactionSectionLabel,
} from "@/components/TransactionSection";
import {
  Plus,
  Copy,
  Trash,
  Search,
  X,
  DollarSign,
  ArrowLeftRight,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronDown,
} from "lucide-react";
import Icon from "@mdi/react";
import { mdiBroom } from "@mdi/js";
import { InputAdornment, MenuItem, TextField } from "@mui/material";
import FeedbackAlert from "@/components/FeedbackAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageContainer from "@/components/PageContainer";
import TableActionButton from "@/components/TableActionButton";

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

const currentMonthInputValue = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${year}-${month}`;
};

const parseDateToTimestamp = (value: string): number => {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  return 0;
};

export default function TransacoesPage() {
  const copySectionClasses = getTransactionSectionClasses("blue");
  const deleteSectionClasses = getTransactionSectionClasses("red");
  const searchSectionClasses = getTransactionSectionClasses("gray");
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
  const [filterMes, setFilterMes] = useState(currentMonthInputValue);

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
  const [advancedActionsOpen, setAdvancedActionsOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

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
      if (sortBy === "vencimento") {
        const dateA = parseDateToTimestamp(a.vencimento);
        const dateB = parseDateToTimestamp(b.vencimento);
        return (dateA - dateB) * direction;
      }
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

      setCopyMesOrigem("");
      setCopyMesesDestino([]);
      setCopyMesDestinoInput("");
      setCopyModalOpen(false);
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
    setDeleteModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterTipo("");
    setFilterCategoria("");
    setFilterBanco("");
    setFilterSituacao("");
    setFilterMes("");
    setCurrentPage(1);
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                <ArrowLeftRight size={32} className="text-blue-600" />
                Gerenciamento de Transações
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Controle seus lançamentos de receitas e despesas
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setAdvancedActionsOpen((prev) => !prev)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 sm:w-auto"
                >
                  Ações Avançadas
                  <ChevronDown size={18} />
                </button>

                {advancedActionsOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg sm:w-72">
                    <button
                      type="button"
                      onClick={() => {
                        setAdvancedActionsOpen(false);
                        setCopyModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                    >
                      <Copy size={16} />
                      Copiar transações por mês
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdvancedActionsOpen(false);
                        setDeleteModalOpen(true);
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      <Trash size={16} />
                      Excluir transações por mês
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setEditingTransacao(undefined);
                  setIsModalOpen(true);
                }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 sm:w-auto"
              >
                <Plus size={20} />
                Nova Transação
              </button>
            </div>
          </div>
        </PageContainer>

        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-blue-900">
                Totais
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-600">Receita</p>
                  <p className="mt-1 text-xl font-bold text-green-600">
                    {formatCurrency(summary.total_receita)}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-600">Despesa</p>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {formatCurrency(summary.total_despesa)}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-600">Líquido</p>
                  <p
                    className={`mt-1 text-xl font-bold ${
                      summary.total_liquido >= 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summary.total_liquido)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-green-200 bg-green-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-green-900">
                Pagos
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-600">Receita</p>
                  <p className="mt-1 text-xl font-bold text-green-600">
                    {formatCurrency(summary.pago_receita)}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-600">Despesa</p>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {formatCurrency(summary.pago_despesa)}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-600">Líquido</p>
                  <p
                    className={`mt-1 text-xl font-bold ${
                      summary.pago_liquido >= 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summary.pago_liquido)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-yellow-300 bg-yellow-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-yellow-900">
                Provisões
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-600">Receita</p>
                  <p className="mt-1 text-xl font-bold text-green-600">
                    {formatCurrency(summary.provisao_receita)}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-600">Despesa</p>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {formatCurrency(summary.provisao_despesa)}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-600">Líquido</p>
                  <p
                    className={`mt-1 text-xl font-bold ${
                      summary.provisao_liquido >= 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summary.provisao_liquido)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filter-panel-surface">
          <TransactionSection title="Buscar Transações" tone="gray">
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                <div>
                  <TextField
                    type="month"
                    label="Mês/Ano"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={filterMes}
                    onChange={(e) => {
                      setFilterMes(e.target.value);
                      handleFilterChange();
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </div>

                {/* Tipo */}
                <div>
                  <TextField
                    select
                    label="Tipo"
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={filterTipo}
                    onChange={(e) => {
                      setFilterTipo(e.target.value as any);
                      handleFilterChange();
                    }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        if (selected === "") return "Todos";
                        return selected === "DESPESA" ? "Despesa" : "Receita";
                      },
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="DESPESA">Despesa</MenuItem>
                    <MenuItem value="RECEITA">Receita</MenuItem>
                  </TextField>
                </div>

                {/* Categoria */}
                <div>
                  <TextField
                    select
                    label="Categoria"
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={
                      filterCategoria === "" ? "" : String(filterCategoria)
                    }
                    onChange={(e) => {
                      setFilterCategoria(
                        e.target.value ? Number(e.target.value) : "",
                      );
                      handleFilterChange();
                    }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        if (selected === "") return "Todos";
                        const category = sortedCategories.find(
                          (cat) => String(cat.id) === selected,
                        );
                        return category?.nome ?? "Todos";
                      },
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {sortedCategories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>

                {/* Banco */}
                <div>
                  <TextField
                    select
                    label="Banco"
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={filterBanco === "" ? "" : String(filterBanco)}
                    onChange={(e) => {
                      setFilterBanco(
                        e.target.value ? Number(e.target.value) : "",
                      );
                      handleFilterChange();
                    }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        if (selected === "") return "Todos";
                        const bank = sortedBanks.find(
                          (item) => String(item.id) === selected,
                        );
                        return bank?.nome ?? "Todos";
                      },
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {sortedBanks.map((bank) => (
                      <MenuItem key={bank.id} value={bank.id}>
                        {bank.nome}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>

                {/* Situação */}
                <div>
                  <TextField
                    select
                    label="Situação"
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={filterSituacao}
                    onChange={(e) => {
                      setFilterSituacao(e.target.value as any);
                      handleFilterChange();
                    }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: (selected) => {
                        if (selected === "") return "Todos";
                        return selected === "PAGO" ? "Pago" : "Pendente";
                      },
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="PAGO">Pago</MenuItem>
                    <MenuItem value="PENDENTE">Pendente</MenuItem>
                  </TextField>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                <div className="lg:col-span-4">
                  <TextField
                    type="search"
                    label="Buscar"
                    placeholder="Digitar..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={18} className="text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className={`${searchSectionClasses.primaryCompactButton} inline-flex items-center gap-2`}
                  >
                    <Icon path={mdiBroom} size={0.75} />
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>
          </TransactionSection>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="p-2 sm:p-3 md:hidden">
            {transacoes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
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
              </div>
            ) : (
              <div className="space-y-2">
                {sortedTransacoes.map((transacao) => (
                  <div
                    key={transacao.id}
                    className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {transacao.descricao_nome || "Sem descrição"}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          {transacao.mes} • Vencimento {transacao.vencimento}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                          transacao.tipo === "DESPESA"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {transacao.tipo}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
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
                        onClick={() => handleToggleSituacao(transacao)}
                        className={`inline-flex min-h-8 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none transition ${
                          transacao.situacao === "PAGO"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }`}
                      >
                        {transacao.situacao}
                      </button>
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(transacao.valor)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                      <TableActionButton
                        action="edit"
                        title="Editar"
                        onClick={() => handleEdit(transacao)}
                      />
                      <TableActionButton
                        action="delete"
                        title="Excluir"
                        onClick={() => handleDelete(transacao.id, transacao.mes)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[900px] w-full text-xs">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("mes")}
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
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("vencimento")}
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
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("tipo")}
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
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("categoria")}
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
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("descricao")}
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
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("banco")}
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
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("valor")}
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
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-900">
                    <button
                      type="button"
                      onClick={() => handleSort("situacao")}
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
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-900">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transacoes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-8 text-center text-gray-500"
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
                      <td className="px-3 py-2 text-xs font-medium text-gray-900">
                        {transacao.mes}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {transacao.vencimento}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
                            transacao.tipo === "DESPESA"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transacao.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {transacao.categoria_nome || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {transacao.descricao_nome || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {transacao.banco_nome || "-"}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-semibold">
                        {formatCurrency(transacao.valor)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleToggleSituacao(transacao)}
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none transition ${
                            transacao.situacao === "PAGO"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                        >
                          {transacao.situacao}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex justify-center gap-2">
                          <TableActionButton
                            action="edit"
                            title="Editar"
                            onClick={() => handleEdit(transacao)}
                            compact
                          />
                          <TableActionButton
                            action="delete"
                            title="Excluir"
                            onClick={() =>
                              handleDelete(transacao.id, transacao.mes)
                            }
                            compact
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {copyModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-base font-semibold text-blue-700">
                  Copiar Transações Por Mês
                </h3>
                <button
                  type="button"
                  onClick={() => setCopyModalOpen(false)}
                  className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <TransactionSectionLabel tone="blue">
                      Mês origem
                    </TransactionSectionLabel>
                    <input
                      type="month"
                      value={copyMesOrigem}
                      onChange={(e) => setCopyMesOrigem(e.target.value)}
                      className={`${copySectionClasses.input} md:w-full`}
                    />
                  </div>

                  <div>
                    <TransactionSectionLabel tone="blue">
                      Mês destino
                    </TransactionSectionLabel>
                    <input
                      type="month"
                      value={copyMesDestinoInput}
                      onChange={(e) => setCopyMesDestinoInput(e.target.value)}
                      className={`${copySectionClasses.input} md:w-full`}
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddDestinoMes}
                      className={copySectionClasses.secondaryButton}
                    >
                      Adicionar destino
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddNextMonths(3)}
                    className={copySectionClasses.shortcutButton}
                  >
                    + 3 meses
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddNextMonths(6)}
                    className={copySectionClasses.shortcutButton}
                  >
                    + 6 meses
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddNextMonths(12)}
                    className={copySectionClasses.shortcutButton}
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
                        className={copySectionClasses.chip}
                        title="Remover mês destino"
                      >
                        {monthApiToInput(mes)} ×
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopyByMonth}
                    disabled={copyLoading}
                    className={`${copySectionClasses.primaryCompactButton} whitespace-nowrap`}
                  >
                    {copyLoading
                      ? "Copiando..."
                      : "Copiar para meses selecionados"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-base font-semibold text-red-700">
                  Excluir Transações Por Mês
                </h3>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <TransactionSectionLabel tone="red">
                      Mês para excluir
                    </TransactionSectionLabel>
                    <input
                      type="month"
                      value={deleteMesInput}
                      onChange={(e) => setDeleteMesInput(e.target.value)}
                      className={`${deleteSectionClasses.input} md:w-full`}
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddDeleteMes}
                      className={deleteSectionClasses.secondaryButton}
                    >
                      Adicionar mês
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddDeleteNextMonths(3)}
                    className={deleteSectionClasses.shortcutButton}
                  >
                    + 3 meses
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDeleteNextMonths(6)}
                    className={deleteSectionClasses.shortcutButton}
                  >
                    + 6 meses
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDeleteNextMonths(12)}
                    className={deleteSectionClasses.shortcutButton}
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
                        className={deleteSectionClasses.chip}
                        title="Remover mês"
                      >
                        {monthApiToInput(mes)} ×
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={requestDeleteByMonths}
                    disabled={deleteMonthsLoading}
                    className={deleteSectionClasses.primaryCompactButton}
                  >
                    {deleteMonthsLoading
                      ? "Excluindo..."
                      : "Excluir meses selecionados"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
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

