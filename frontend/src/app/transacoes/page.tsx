"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Transacao,
  TransacaoFilters,
  TransacaoSummary,
  CopyMonthResult,
  DeleteMonthsResult,
  DeleteTransactionMonthsResult,
} from "@/types/transacao";
import { Category } from "@/types/category";
import { Bank } from "@/types/bank";
import { transacaoService } from "@/services/transacaoService";
import { categoryService } from "@/services/categoryService";
import { bankService } from "@/services/bankService";
import { TransacaoModal } from "@/components/TransacaoModal";
import Pagination from "@/components/Pagination";
import {
  ArrowLeftRight,
  Filter,
  MoreVertical,
  ChevronDown,
  Copy,
  Trash,
} from "lucide-react";
import Icon from "@mdi/react";
import { mdiPlusBoxOutline } from "@mdi/js";
import FeedbackAlert from "@/components/FeedbackAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import ViewDataModal from "@/components/ViewDataModal";
import { useAccessibleModal } from "@/utils/useAccessibleModal";
import { createPortal } from "react-dom";

// New Components
import { TransactionSummaryCards } from "./components/TransactionSummaryCards";
import { TransactionFilters } from "./components/TransactionFilters";
import { TransactionList } from "./components/TransactionList";
import { AdvancedActionModals } from "./components/AdvancedActionModals";

interface DeleteConfirmation {
  isOpen: boolean;
  transacaoId: number | null;
  transacaoMes: string | null;
}

interface DeleteTransactionMonthsTarget {
  transacaoId: number;
  transacaoMes: string;
}

interface FeedbackMessage {
  type: "success" | "error";
  message: string;
}

const situacaoLabel: Record<"PENDENTE" | "PAGO", string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
};

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
  const copyModalRef = useRef<HTMLDivElement>(null);
  const copyModalTitleId = useId();
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const deleteModalTitleId = useId();
  const deleteTransactionMonthsModalRef = useRef<HTMLDivElement>(null);
  const deleteTransactionMonthsModalTitleId = useId();

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
  const [filterTipo, setFilterTipo] = useState<
    "DESPESA" | "RECEITA" | "TODOS"
  >("TODOS");
  const [filterCategoria, setFilterCategoria] = useState<number | "TODOS">(
    "TODOS",
  );
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [filterSituacao, setFilterSituacao] = useState<
    "PENDENTE" | "PAGO" | "TODOS"
  >("TODOS");
  const [filterMes, setFilterMes] = useState(currentMonthInputValue);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao>();
  const [viewingTransacao, setViewingTransacao] = useState<Transacao | null>(
    null,
  );

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
  >("vencimento");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [copyMesOrigem, setCopyMesOrigem] = useState("");
  const [copyMesDestinoInput, setCopyMesDestinoInput] = useState("");
  const [copyMesesDestino, setCopyMesesDestino] = useState<string[]>([]);
  const [copyLoading, setCopyLoading] = useState(false);
  const [deleteMesInput, setDeleteMesInput] = useState("");
  const [deleteMeses, setDeleteMeses] = useState<string[]>([]);
  const [deleteMonthsLoading, setDeleteMonthsLoading] = useState(false);
  const [deleteMonthsConfirmOpen, setDeleteMonthsConfirmOpen] = useState(false);
  const [deleteTransactionMonthsTarget, setDeleteTransactionMonthsTarget] =
    useState<DeleteTransactionMonthsTarget | null>(null);
  const [deleteTransactionMesInput, setDeleteTransactionMesInput] =
    useState("");
  const [deleteTransactionMeses, setDeleteTransactionMeses] = useState<string[]>(
    [],
  );
  const [deleteTransactionMonthsLoading, setDeleteTransactionMonthsLoading] =
    useState(false);
  const [deleteTransactionMonthsModalOpen, setDeleteTransactionMonthsModalOpen] =
    useState(false);
  const [deleteTransactionMonthsConfirmOpen, setDeleteTransactionMonthsConfirmOpen] =
    useState(false);
  const [advancedActionsOpen, setAdvancedActionsOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isPortalReady, setIsPortalReady] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterTipo !== "TODOS") count++;
    if (filterCategoria !== "TODOS") count++;
    if (filterBanco !== "TODOS") count++;
    if (filterSituacao !== "TODOS") count++;
    return count;
  }, [
    searchTerm,
    filterTipo,
    filterCategoria,
    filterBanco,
    filterSituacao,
  ]);

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setIsPortalReady(true);
  }, []);

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
      await loadTransacoes();
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
      if (filterTipo !== "TODOS") filters.tipo = filterTipo;
      if (filterCategoria !== "TODOS")
        filters.categoria_id = filterCategoria as number;
      if (filterBanco !== "TODOS") filters.banco_id = filterBanco as number;
      if (filterSituacao !== "TODOS") filters.situacao = filterSituacao;
      const mesApi = monthInputToApi(filterMes);
      if (mesApi) filters.mes = mesApi;

      const response = await transacaoService.getAll(filters);
      setTransacoes(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);

      const summaryResponse = await transacaoService.getSummary({
        search: searchTerm || undefined,
        tipo: filterTipo === "TODOS" ? undefined : filterTipo,
        categoria_id:
          filterCategoria === "TODOS" ? undefined : (filterCategoria as number),
        banco_id: filterBanco === "TODOS" ? undefined : (filterBanco as number),
        situacao: filterSituacao === "TODOS" ? undefined : filterSituacao,
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

  useAccessibleModal({
    isOpen: copyModalOpen,
    modalRef: copyModalRef,
    onClose: () => setCopyModalOpen(false),
  });

  useAccessibleModal({
    isOpen: deleteModalOpen,
    modalRef: deleteModalRef,
    onClose: () => setDeleteModalOpen(false),
  });

  useAccessibleModal({
    isOpen: deleteTransactionMonthsModalOpen,
    modalRef: deleteTransactionMonthsModalRef,
    onClose: () => setDeleteTransactionMonthsModalOpen(false),
  });

  const handleView = (transacao: Transacao) => {
    setViewingTransacao(transacao);
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
        await loadTransacoes();
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

  const handleOpenDeleteTransactionMonths = () => {
    if (!deleteConfirm.transacaoId || !deleteConfirm.transacaoMes) {
      showFeedback("error", "Não foi possível identificar a transação base.");
      return;
    }

    const mesBase = deleteConfirm.transacaoMes;
    setDeleteTransactionMonthsTarget({
      transacaoId: deleteConfirm.transacaoId,
      transacaoMes: mesBase,
    });
    setDeleteTransactionMesInput(monthApiToInput(mesBase));
    setDeleteTransactionMeses([mesBase]);
    setDeleteTransactionMonthsModalOpen(true);
    setDeleteConfirm({
      isOpen: false,
      transacaoId: null,
      transacaoMes: null,
    });
  };

  const handleToggleSituacao = async (transacao: Transacao) => {
    try {
      const novaSituacao = transacao.situacao === "PAGO" ? "PENDENTE" : "PAGO";
      await transacaoService.update(transacao.id, { situacao: novaSituacao });
      showFeedback("success", `Transação marcada como ${situacaoLabel[novaSituacao]}.`);
      await loadTransacoes();
    } catch (error) {
      console.error("Erro ao atualizar situação:", error);
      showFeedback("error", "Não foi possível atualizar a situação.");
    }
  };

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

  const handleAddDeleteTransactionMes = () => {
    const mesApi = monthInputToApi(deleteTransactionMesInput);
    if (!mesApi) {
      showFeedback("error", "Selecione um mês válido para exclusão.");
      return;
    }

    setDeleteTransactionMeses((prev) => {
      if (prev.includes(mesApi)) return prev;
      return [...prev, mesApi].sort((a, b) => {
        const [ma, ya] = a.split("/");
        const [mb, yb] = b.split("/");
        return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
      });
    });
    setDeleteTransactionMesInput("");
  };

  const handleRemoveDeleteTransactionMes = (mes: string) => {
    setDeleteTransactionMeses((prev) => prev.filter((item) => item !== mes));
  };

  const handleAddDeleteTransactionNextMonths = (count: number) => {
    const baseMesApi = monthInputToApi(deleteTransactionMesInput);
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

    setDeleteTransactionMeses((prev) => {
      const merged = Array.from(new Set([...prev, ...generated]));
      return merged.sort((a, b) => {
        const [ma, ya] = a.split("/");
        const [mb, yb] = b.split("/");
        return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
      });
    });
  };

  const requestDeleteTransactionByMonths = () => {
    if (!deleteTransactionMonthsTarget) {
      showFeedback("error", "Selecione uma transação para exclusão em meses.");
      return;
    }

    if (deleteTransactionMeses.length === 0) {
      showFeedback("error", "Adicione ao menos um mês para exclusão.");
      return;
    }

    setDeleteTransactionMonthsConfirmOpen(true);
    setDeleteTransactionMonthsModalOpen(false);
  };

  const handleDeleteTransactionByMonths = async () => {
    if (!deleteTransactionMonthsTarget) {
      showFeedback("error", "Selecione uma transação para exclusão em meses.");
      return;
    }

    if (deleteTransactionMeses.length === 0) {
      showFeedback("error", "Adicione ao menos um mês para exclusão.");
      return;
    }

    try {
      setDeleteTransactionMonthsLoading(true);
      const result: DeleteTransactionMonthsResult =
        await transacaoService.deleteByTransactionMonths({
          transacao_id: deleteTransactionMonthsTarget.transacaoId,
          meses: deleteTransactionMeses,
        });

      showFeedback(
        "success",
        `Exclusão concluída: ${result.total_excluidas} transação(ões) removida(s) em ${result.meses.length} mês(es).`,
      );

      setDeleteTransactionMonthsTarget(null);
      setDeleteTransactionMeses([]);
      setDeleteTransactionMesInput("");
      setDeleteTransactionMonthsModalOpen(false);
      setCurrentPage(1);
      await loadTransacoes();
    } catch (error) {
      const apiMessage = (error as any)?.response?.data?.message;
      showFeedback(
        "error",
        apiMessage || "Não foi possível excluir a transação nos meses selecionados.",
      );
    } finally {
      setDeleteTransactionMonthsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterTipo("TODOS");
    setFilterCategoria("TODOS");
    setFilterBanco("TODOS");
    setFilterSituacao("TODOS");
    setFilterMes(currentMonthInputValue());
    setCurrentPage(1);
  };

  const viewingTransacaoData = useMemo(() => {
    if (!viewingTransacao) return null;
    const { categoria_id, banco_id, descricao_id, ...rest } = viewingTransacao;
    
    // Removendo campos internos e formatando para exibição
    const data = { ...rest } as Record<string, any>;
    delete data.id;
    delete data.created_at;
    delete data.updated_at;
    
    return data;
  }, [viewingTransacao]);

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer className="w-full">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-3 text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl dark:text-white">
                <ArrowLeftRight size={32} className="shrink-0 text-blue-600 dark:text-blue-400" />
                <span>Gerenciamento de Transações</span>
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                Controle suas receitas e despesas mensais
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center shrink-0">
              <AppButton
                tone={showFilters ? "outline-primary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="relative w-full md:w-auto"
                startIcon={<Filter size={18} className={showFilters ? "fill-blue-100 dark:fill-blue-900/50" : ""} />}
              >
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                    {activeFiltersCount}
                  </span>
                )}
              </AppButton>
              
              <div className="relative inline-block text-left">
                {/* Desktop Dropdown Button */}
                <div className="hidden sm:block">
                  <AppButton
                    tone="outline"
                    onClick={() => setAdvancedActionsOpen((prev) => !prev)}
                    endIcon={<ChevronDown size={18} />}
                    className="w-full sm:w-auto"
                  >
                    Ações Avançadas
                  </AppButton>

                  {advancedActionsOpen && (
                    <div className="absolute right-0 z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg sm:w-72 dark:bg-slate-800 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setAdvancedActionsOpen(false);
                          setCopyModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
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
                        className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        <Trash size={16} />
                        Excluir transações por mês
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Bottom Sheet Trigger */}
                <div className="sm:hidden">
                  <AppButton
                    tone="outline"
                    onClick={() => setAdvancedActionsOpen(true)}
                    startIcon={<MoreVertical size={18} />}
                    className="w-full"
                  >
                    Ações
                  </AppButton>

                  {advancedActionsOpen && isPortalReady && createPortal(
                    <div className="fixed inset-0 z-[100] md:hidden">
                      <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={() => setAdvancedActionsOpen(false)}
                      />
                      <div className="absolute inset-x-0 bottom-0 animate-in slide-in-from-bottom duration-300 rounded-t-2xl bg-white p-4 pb-8 shadow-2xl dark:bg-slate-900">
                        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-slate-700" />
                        <h3 className="mb-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Menu de Ações
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          <button
                            onClick={() => {
                              setAdvancedActionsOpen(false);
                              setCopyModalOpen(true);
                            }}
                            className="flex w-full items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-left text-blue-700 transition active:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                              <Copy size={20} />
                            </div>
                            <div>
                              <p className="font-bold">Copiar por Mês</p>
                              <p className="text-xs opacity-70">Replicar dados para outros períodos</p>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setAdvancedActionsOpen(false);
                              setDeleteModalOpen(true);
                            }}
                            className="flex w-full items-center gap-4 rounded-xl border border-red-100 bg-red-50/50 p-4 text-left text-red-700 transition active:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400">
                              <Trash size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-red-700 dark:text-red-400">Excluir por Mês</p>
                              <p className="text-xs text-red-600 opacity-70 dark:text-red-400">Limpeza de dados em lote</p>
                            </div>
                          </button>
                        </div>
                        <button
                          onClick={() => setAdvancedActionsOpen(false)}
                          className="mt-4 w-full rounded-xl bg-gray-100 p-4 text-sm font-bold text-gray-700 transition active:bg-gray-200 dark:bg-slate-800 dark:text-slate-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>

              <AppButton
                onClick={() => {
                  setEditingTransacao(undefined);
                  setIsModalOpen(true);
                }}
                tone="primary"
                startIcon={<Icon path={mdiPlusBoxOutline} size={0.8} />}
                className="w-full sm:w-auto"
              >
                Nova Transação
              </AppButton>
            </div>
          </div>
        </PageContainer>

        <div className="w-full overflow-x-auto">
          <TransactionFilters
            searchTerm={searchTerm}
            filterTipo={filterTipo}
            filterCategoria={filterCategoria}
            filterBanco={filterBanco}
            filterSituacao={filterSituacao}
            filterMes={filterMes}
            showFilters={showFilters}
            categories={categories}
            banks={banks}
            onSearch={handleSearch}
            onFilterTipoChange={(val) => {
              setFilterTipo(val);
              setFilterCategoria("TODOS");
              setCurrentPage(1);
            }}
            onFilterCategoriaChange={(val) => {
              setFilterCategoria(val);
              setCurrentPage(1);
            }}
            onFilterBancoChange={(val) => {
              setFilterBanco(val);
              setCurrentPage(1);
            }}
            onFilterSituacaoChange={(val) => {
              setFilterSituacao(val);
              setCurrentPage(1);
            }}
            onFilterMesChange={(val) => {
              setFilterMes(val);
              setCurrentPage(1);
            }}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="w-full overflow-hidden">
          <TransactionSummaryCards summary={summary} />
        </div>

        <div className="app-surface p-4 w-full overflow-hidden">
          <TransactionList
            transacoes={sortedTransacoes}
            loading={loading}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleSituacao={handleToggleSituacao}
            onAddTransaction={() => {
              setEditingTransacao(undefined);
              setIsModalOpen(true);
            }}
            onClearFilters={handleClearFilters}
          />
        </div>

        {!loading && transacoes.length > 0 && (
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
        isOpen={!!viewingTransacao}
        title="Visualizar Transação"
        data={viewingTransacaoData}
        onClose={() => setViewingTransacao(null)}
      />

      <TransacaoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransacao(undefined);
        }}
        onSuccess={async (message) => {
          showFeedback("success", message);
          await loadTransacoes();
        }}
        transacao={editingTransacao}
        isEditing={!!editingTransacao}
      />

      <AdvancedActionModals
        isPortalReady={isPortalReady}
        copyModalOpen={copyModalOpen}
        onCopyModalClose={() => setCopyModalOpen(false)}
        copyMesOrigem={copyMesOrigem}
        setCopyMesOrigem={setCopyMesOrigem}
        copyMesDestinoInput={copyMesDestinoInput}
        setCopyMesDestinoInput={setCopyMesDestinoInput}
        copyMesesDestino={copyMesesDestino}
        onAddDestinoMes={handleAddDestinoMes}
        onRemoveDestinoMes={handleRemoveDestinoMes}
        onAddNextMonths={handleAddNextMonths}
        onCopyByMonth={handleCopyByMonth}
        copyLoading={copyLoading}
        deleteModalOpen={deleteModalOpen}
        onDeleteModalClose={() => setDeleteModalOpen(false)}
        deleteMesInput={deleteMesInput}
        setDeleteMesInput={setDeleteMesInput}
        deleteMeses={deleteMeses}
        onAddDeleteMes={handleAddDeleteMes}
        onRemoveDeleteMes={handleRemoveDeleteMes}
        onAddDeleteNextMonths={handleAddDeleteNextMonths}
        onRequestDeleteByMonths={requestDeleteByMonths}
        deleteMonthsLoading={deleteMonthsLoading}
        deleteTransactionMonthsModalOpen={deleteTransactionMonthsModalOpen}
        onDeleteTransactionMonthsModalClose={() => {
          setDeleteTransactionMonthsModalOpen(false);
          setDeleteTransactionMonthsTarget(null);
          setDeleteTransactionMeses([]);
          setDeleteTransactionMesInput("");
        }}
        deleteTransactionMonthsTarget={deleteTransactionMonthsTarget}
        deleteTransactionMesInput={deleteTransactionMesInput}
        setDeleteTransactionMesInput={setDeleteTransactionMesInput}
        deleteTransactionMeses={deleteTransactionMeses}
        onAddDeleteTransactionMes={handleAddDeleteTransactionMes}
        onRemoveDeleteTransactionMes={handleRemoveDeleteTransactionMes}
        onAddDeleteTransactionNextMonths={handleAddDeleteTransactionNextMonths}
        onRequestDeleteTransactionByMonths={requestDeleteTransactionByMonths}
        deleteTransactionMonthsLoading={deleteTransactionMonthsLoading}
        copyModalRef={copyModalRef}
        copyModalTitleId={copyModalTitleId}
        deleteModalRef={deleteModalRef}
        deleteModalTitleId={deleteModalTitleId}
        deleteTransactionMonthsModalRef={deleteTransactionMonthsModalRef}
        deleteTransactionMonthsModalTitleId={deleteTransactionMonthsModalTitleId}
        monthApiToInput={monthApiToInput}
      />

      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title="Confirmar exclusão"
        description={
          <>
            Esta ação removerá a transação do mês{" "}
            <strong>{deleteConfirm.transacaoMes}</strong>.
            <span className="mt-2 block text-xs text-[rgb(var(--app-text-secondary))]">
              Quer excluir esta mesma transação em vários meses?{" "}
              <button
                type="button"
                onClick={handleOpenDeleteTransactionMonths}
                className="font-semibold text-red-700 underline-offset-2 hover:underline dark:text-red-400"
              >
                Selecionar meses
              </button>
            </span>
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

      <ConfirmDeleteModal
        isOpen={deleteTransactionMonthsConfirmOpen}
        title="Confirmar exclusão da transação por meses"
        description={
          deleteTransactionMeses.length === 1 ? (
            <>
              Esta ação removerá a transação selecionada do mês{" "}
              <strong>{deleteTransactionMeses[0]}</strong>.
            </>
          ) : (
            <>
              Esta ação removerá a transação selecionada em{" "}
              <strong>{deleteTransactionMeses.length} meses</strong>.
            </>
          )
        }
        confirmLabel="Excluir transação"
        onCancel={() => setDeleteTransactionMonthsConfirmOpen(false)}
        onConfirm={async () => {
          setDeleteTransactionMonthsConfirmOpen(false);
          await handleDeleteTransactionByMonths();
        }}
      />
    </div>
  );
}
