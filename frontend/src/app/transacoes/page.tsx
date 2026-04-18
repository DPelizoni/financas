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
import { toast } from "sonner";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import ViewDataModal from "@/components/ViewDataModal";
import { useAccessibleModal } from "@/utils/useAccessibleModal";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const copyModalRef = useRef<HTMLDivElement>(null);
  const copyModalTitleId = useId();
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const deleteModalTitleId = useId();
  const deleteTransactionMonthsModalRef = useRef<HTMLDivElement>(null);
  const deleteTransactionMonthsModalTitleId = useId();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<"DESPESA" | "RECEITA" | "TODOS">("TODOS");
  const [filterCategoria, setFilterCategoria] = useState<number | "TODOS">("TODOS");
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [filterSituacao, setFilterSituacao] = useState<"PENDENTE" | "PAGO" | "TODOS">("TODOS");
  const [filterMes, setFilterMes] = useState(currentMonthInputValue);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao>();
  const [viewingTransacao, setViewingTransacao] = useState<Transacao | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation>({
    isOpen: false,
    transacaoId: null,
    transacaoMes: null,
  });

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
  const [deleteTransactionMonthsTarget, setDeleteTransactionMonthsTarget] = useState<DeleteTransactionMonthsTarget | null>(null);
  const [deleteTransactionMesInput, setDeleteTransactionMesInput] = useState("");
  const [deleteTransactionMeses, setDeleteTransactionMeses] = useState<string[]>([]);
  const [deleteTransactionMonthsLoading, setDeleteTransactionMonthsLoading] = useState(false);
  const [deleteTransactionMonthsModalOpen, setDeleteTransactionMonthsModalOpen] = useState(false);
  const [deleteTransactionMonthsConfirmOpen, setDeleteTransactionMonthsConfirmOpen] = useState(false);
  const [advancedActionsOpen, setAdvancedActionsOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isPortalReady, setIsPortalReady] = useState(false);

  // TanStack Queries
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll({ limit: 999 }).then((res) => res.data || []),
  });

  const { data: banks = [] } = useQuery({
    queryKey: ["banks"],
    queryFn: () => bankService.getAll({ limit: 999 }).then((res) => res.data || []),
  });

  const queryFilters = useMemo(() => {
    const filters: TransacaoFilters = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (searchTerm) filters.search = searchTerm;
    if (filterTipo !== "TODOS") filters.tipo = filterTipo;
    if (filterCategoria !== "TODOS") filters.categoria_id = filterCategoria as number;
    if (filterBanco !== "TODOS") filters.banco_id = filterBanco as number;
    if (filterSituacao !== "TODOS") filters.situacao = filterSituacao;
    const mesApi = monthInputToApi(filterMes);
    if (mesApi) filters.mes = mesApi;
    return filters;
  }, [currentPage, itemsPerPage, searchTerm, filterTipo, filterCategoria, filterBanco, filterSituacao, filterMes]);

  const { data: transacoesData, isLoading: loadingTransacoes } = useQuery({
    queryKey: ["transacoes", queryFilters],
    queryFn: () => transacaoService.getAll(queryFilters),
  });

  const { data: summary } = useQuery({
    queryKey: ["transacoes-summary", queryFilters],
    queryFn: () => transacaoService.getSummary(queryFilters),
  });

  const transacoes = transacoesData?.data || [];
  const totalPages = transacoesData?.pagination?.totalPages || 1;
  const total = transacoesData?.pagination?.total || 0;

  // Mutations
  const toggleSituacaoMutation = useMutation({
    mutationFn: (transacao: Transacao) => {
      const novaSituacao = transacao.situacao === "PAGO" ? "PENDENTE" : "PAGO";
      return transacaoService.update(transacao.id, { situacao: novaSituacao });
    },
    onMutate: async (updatedTransacao) => {
      await queryClient.cancelQueries({ queryKey: ["transacoes"] });
      const previousData = queryClient.getQueryData(["transacoes", queryFilters]);
      
      queryClient.setQueryData(["transacoes", queryFilters], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((t: Transacao) => 
            t.id === updatedTransacao.id 
              ? { ...t, situacao: t.situacao === "PAGO" ? "PENDENTE" : "PAGO" } 
              : t
          )
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["transacoes", queryFilters], context?.previousData);
      toast.error("Erro ao atualizar situação.");
    },
    onSuccess: (data, variables) => {
      const novaSituacao = variables.situacao === "PAGO" ? "PENDENTE" : "PAGO";
      toast.success(`Transação marcada como ${situacaoLabel[novaSituacao]}.`);
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["transacoes-summary"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => transacaoService.delete(id),
    onSuccess: () => {
      toast.success("Transação excluída com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["transacoes-summary"] });
    },
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Não foi possível excluir a transação.");
    }
  });

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterTipo !== "TODOS") count++;
    if (filterCategoria !== "TODOS") count++;
    if (filterBanco !== "TODOS") count++;
    if (filterSituacao !== "TODOS") count++;
    return count;
  }, [searchTerm, filterTipo, filterCategoria, filterBanco, filterSituacao]);

  const handleSort = (column: any) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDirection("asc");
  };

  useEffect(() => {
    setIsPortalReady(true);
  }, []);

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
      deleteMutation.mutate(deleteConfirm.transacaoId);
      setDeleteConfirm({
        isOpen: false,
        transacaoId: null,
        transacaoMes: null,
      });
    }
  };

  const handleOpenDeleteTransactionMonths = () => {
    if (!deleteConfirm.transacaoId || !deleteConfirm.transacaoMes) {
      toast.error("Não foi possível identificar a transação base.");
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

  const handleToggleSituacao = (transacao: Transacao) => {
    toggleSituacaoMutation.mutate(transacao);
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
      toast.error("Selecione um mês de destino válido.");
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
      toast.error("Selecione o mês de origem para usar o atalho.");
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
      toast.error("Selecione o mês de origem.");
      return;
    }

    if (copyMesesDestino.length === 0) {
      toast.error("Adicione ao menos um mês de destino.");
      return;
    }

    const destinoSemOrigem = copyMesesDestino.filter((m) => m !== origemApi);
    if (destinoSemOrigem.length === 0) {
      toast.error("O mês de destino deve ser diferente do mês de origem.");
      return;
    }

    try {
      setCopyLoading(true);
      const result: CopyMonthResult = await transacaoService.copyByMonth({
        mes_origem: origemApi,
        meses_destino: destinoSemOrigem,
      });

      toast.success(`Cópia concluída: ${result.total_criadas} transações criadas.`);
      setCopyMesOrigem("");
      setCopyMesesDestino([]);
      setCopyMesDestinoInput("");
      setCopyModalOpen(false);
      setCurrentPage(1);
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Não foi possível copiar as transações.");
    } finally {
      setCopyLoading(false);
    }
  };

  const handleAddDeleteMes = () => {
    const mesApi = monthInputToApi(deleteMesInput);
    if (!mesApi) {
      toast.error("Selecione um mês válido para exclusão.");
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
      toast.error("Para usar este atalho, selecione o mês na rotina de exclusão.");
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
      toast.error("Adicione ao menos um mês para exclusão.");
      return;
    }

    try {
      setDeleteMonthsLoading(true);
      const result: DeleteMonthsResult = await transacaoService.deleteByMonths({
        meses: deleteMeses,
      });

      toast.success(`Exclusão concluída: ${result.total_excluidas} transações removidas.`);
      setDeleteMeses([]);
      setDeleteMesInput("");
      setCurrentPage(1);
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["transacoes-summary"] });
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Não foi possível excluir as transações.");
    } finally {
      setDeleteMonthsLoading(false);
    }
  };

  const requestDeleteByMonths = () => {
    if (deleteMeses.length === 0) {
      toast.error("Adicione ao menos um mês para exclusão.");
      return;
    }
    setDeleteMonthsConfirmOpen(true);
    setDeleteModalOpen(false);
  };

  const handleAddDeleteTransactionMes = () => {
    const mesApi = monthInputToApi(deleteTransactionMesInput);
    if (!mesApi) {
      toast.error("Selecione um mês válido para exclusão.");
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
      toast.error("Para usar este atalho, selecione o mês na rotina de exclusão.");
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
      toast.error("Selecione uma transação para exclusão.");
      return;
    }
    if (deleteTransactionMeses.length === 0) {
      toast.error("Adicione ao menos um mês para exclusão.");
      return;
    }
    setDeleteTransactionMonthsConfirmOpen(true);
    setDeleteTransactionMonthsModalOpen(false);
  };

  const handleDeleteTransactionByMonths = async () => {
    if (!deleteTransactionMonthsTarget) return;

    try {
      setDeleteTransactionMonthsLoading(true);
      const result: DeleteTransactionMonthsResult =
        await transacaoService.deleteByTransactionMonths({
          transacao_id: deleteTransactionMonthsTarget.transacaoId,
          meses: deleteTransactionMeses,
        });

      toast.success(`Exclusão concluída: ${result.total_excluidas} transações removidas.`);
      setDeleteTransactionMonthsTarget(null);
      setDeleteTransactionMeses([]);
      setDeleteTransactionMesInput("");
      setDeleteTransactionMonthsModalOpen(false);
      setCurrentPage(1);
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["transacoes-summary"] });
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Não foi possível excluir a transação.");
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
    const data = { ...rest } as Record<string, any>;
    delete data.id;
    return data;
  }, [viewingTransacao]);

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageContainer>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
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
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
                {activeFiltersCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                    {activeFiltersCount}
                  </span>
                )}
              </AppButton>
              
              <div className="relative inline-block text-left">
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

        {summary && (
          <TransactionSummaryCards summary={summary} />
        )}

        <div className="app-surface p-4 w-full overflow-hidden">
          <TransactionList
            transacoes={sortedTransacoes}
            loading={loadingTransacoes}
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

        {!loadingTransacoes && transacoes.length > 0 && (
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
          toast.success(message);
          queryClient.invalidateQueries({ queryKey: ["transacoes"] });
          queryClient.invalidateQueries({ queryKey: ["transacoes-summary"] });
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
