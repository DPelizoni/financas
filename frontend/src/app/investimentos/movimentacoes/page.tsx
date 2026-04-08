"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Search,
  X,
} from "lucide-react";
import { InputAdornment, MenuItem, TextField } from "@mui/material";
import Icon from "@mdi/react";
import { mdiPlusBoxOutline } from "@mdi/js";
import AppButton from "@/components/AppButton";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import FeedbackAlert from "@/components/FeedbackAlert";
import InvestimentoMovimentacaoModal from "@/components/InvestimentoMovimentacaoModal";
import PageContainer from "@/components/PageContainer";
import Pagination from "@/components/Pagination";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { bankService } from "@/services/bankService";
import {
  investimentoAtivoService,
  investimentoDashboardService,
  investimentoMovimentacaoService,
} from "@/services/investimentoService";
import { Bank } from "@/types/bank";
import {
  InvestimentoAtivo,
  InvestimentoMovimentacao,
  InvestimentoMovimentacaoFilters,
  InvestimentoMovimentacaoTipo,
} from "@/types/investimento";

const tipoLabel: Record<InvestimentoMovimentacaoTipo, string> = {
  APORTE: "Aporte",
  RESGATE: "Resgate",
  RENDIMENTO: "Rendimentos",
};

const formatCurrencyBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const formatDateBR = (value: string): string => {
  if (!value) return "-";
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const toIsoDate = (date: Date): string => {
  const timezoneOffsetInMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetInMs).toISOString().slice(0, 10);
};

const getDateRangeByFilters = ({
  filterMesAno,
  filterAno,
}: {
  filterMesAno: string;
  filterAno: string;
}): { data_de?: string; data_ate?: string } => {
  if (/^\d{4}-\d{2}$/.test(filterMesAno)) {
    const [yearValue, monthValue] = filterMesAno.split("-").map(Number);
    const startDate = new Date(yearValue, monthValue - 1, 1);
    const endDate = new Date(yearValue, monthValue, 0);
    return {
      data_de: toIsoDate(startDate),
      data_ate: toIsoDate(endDate),
    };
  }

  if (filterAno !== "TODOS") {
    const selectedYear = Number(filterAno);
    if (!Number.isNaN(selectedYear)) {
      return {
        data_de: toIsoDate(new Date(selectedYear, 0, 1)),
        data_ate: toIsoDate(new Date(selectedYear, 11, 31)),
      };
    }
  }

  return {};
};

export default function InvestimentosMovimentacoesPage() {
  const [loading, setLoading] = useState(true);
  const [movimentacoes, setMovimentacoes] = useState<InvestimentoMovimentacao[]>([]);
  const [ativos, setAtivos] = useState<InvestimentoAtivo[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMesAno, setFilterMesAno] = useState("");
  const [filterAno, setFilterAno] = useState<string>("TODOS");
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<"data" | "tipo" | "ativo" | "banco" | "valor">(
    "data",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [editingMovimentacao, setEditingMovimentacao] =
    useState<InvestimentoMovimentacao | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InvestimentoMovimentacao | null>(
    null,
  );
  const [viewingMovimentacao, setViewingMovimentacao] =
    useState<InvestimentoMovimentacao | null>(null);

  const sortedBanks = useMemo(
    () => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [banks],
  );

  const sortedMovimentacoes = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...movimentacoes].sort((a, b) => {
      if (sortBy === "data") return a.data.localeCompare(b.data) * direction;
      if (sortBy === "tipo") return a.tipo.localeCompare(b.tipo, "pt-BR") * direction;
      if (sortBy === "ativo") {
        return (a.ativo_nome || "").localeCompare(b.ativo_nome || "", "pt-BR") * direction;
      }
      if (sortBy === "banco") {
        return (a.banco_nome || "").localeCompare(b.banco_nome || "", "pt-BR") * direction;
      }
      return (Number(a.valor) - Number(b.valor)) * direction;
    });
  }, [movimentacoes, sortBy, sortDirection]);

  const handleSort = (
    column: "data" | "tipo" | "ativo" | "banco" | "valor",
  ) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection(column === "data" ? "desc" : "asc");
  };

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const loadReferenceData = async () => {
    try {
      const [banksResponse, ativosResponse] = await Promise.all([
        bankService.getAll({ page: 1, limit: 999 }),
        investimentoAtivoService.getAll({ page: 1, limit: 999 }),
      ]);

      setBanks(banksResponse.data || []);
      setAtivos(ativosResponse.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados auxiliares:", error);
    }
  };

  const loadMovimentacoes = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRangeByFilters({
        filterMesAno,
        filterAno,
      });

      const filters: InvestimentoMovimentacaoFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
        data_de: dateRange.data_de,
        data_ate: dateRange.data_ate,
      };

      const movimentacoesResponse =
        await investimentoMovimentacaoService.getAll(filters);

      setMovimentacoes(movimentacoesResponse.data || []);
      setTotal(movimentacoesResponse.pagination?.total || 0);
      setTotalPages(movimentacoesResponse.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Erro ao carregar movimentacoes:", error);
      showFeedback("error", "Não foi possível carregar as movimentações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const years = await investimentoDashboardService.getAvailableYears({
          banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
        });
        setAvailableYears(years);

        if (filterAno !== "TODOS" && !years.includes(filterAno)) {
          setFilterAno("TODOS");
        }
      } catch (error) {
        console.error("Erro ao carregar anos disponíveis:", error);
        setAvailableYears([]);
      }
    };

    loadAvailableYears();
  }, [filterBanco, filterAno]);

  useEffect(() => {
    loadMovimentacoes();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    filterMesAno,
    filterAno,
    filterBanco,
  ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterMesAno("");
    setFilterAno("TODOS");
    setFilterBanco("TODOS");
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setEditingMovimentacao(null);
    setShowModal(true);
  };

  const handleEdit = (movimentacao: InvestimentoMovimentacao) => {
    setEditingMovimentacao(movimentacao);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await investimentoMovimentacaoService.delete(deleteTarget.id);
      showFeedback("success", "Movimentação excluída com sucesso.");
      setDeleteTarget(null);
      await loadMovimentacoes();
    } catch (error) {
      console.error("Erro ao excluir movimentacao:", error);
      const apiMessage = (error as any)?.response?.data?.message;
      showFeedback("error", apiMessage || "Não foi possível excluir a movimentação.");
    }
  };

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Movimentações de Investimento
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Registre e acompanhe lançamentos de aportes, resgates e rendimentos.
              </p>
            </div>
            <AppButton
              onClick={handleCreate}
              tone="primary"
              startIcon={<Icon path={mdiPlusBoxOutline} size={0.8} />}
              className="w-full sm:w-auto"
            >
              Nova Movimentação
            </AppButton>
          </div>
        </PageContainer>

        <div className="filter-panel-surface">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <TextField
              type="text"
              label="Buscar"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} className="text-gray-400" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <button
                      type="button"
                      aria-label="Limpar busca"
                      className="rounded p-1 hover:bg-gray-100"
                      onClick={() => {
                        setSearchTerm("");
                        setCurrentPage(1);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </InputAdornment>
                ) : undefined,
              }}
            />

            <TextField
              type="month"
              label="Mês/Ano"
              variant="outlined"
              size="small"
              fullWidth
              value={filterMesAno}
              onChange={(e) => {
                setFilterMesAno(e.target.value);
                setCurrentPage(1);
              }}
              title="Mês/Ano específico"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              label="Ano"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterAno}
              onChange={(e) => {
                setFilterAno(e.target.value);
                setCurrentPage(1);
              }}
              disabled={Boolean(filterMesAno)}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Bancos"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterBanco}
              onChange={(e) => {
                setFilterBanco(
                  e.target.value === "TODOS" ? "TODOS" : Number(e.target.value),
                );
                setCurrentPage(1);
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              {sortedBanks.map((bank) => (
                <MenuItem key={bank.id} value={bank.id}>
                  {bank.nome}
                </MenuItem>
              ))}
            </TextField>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="app-button-outline-danger inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition md:w-auto md:justify-start"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        <div className="app-surface p-4">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando dados...</p>
            </div>
          ) : sortedMovimentacoes.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-600">
              Nenhuma movimentação encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full divide-y divide-gray-200 text-xs">
                <thead className="app-table-head">
                  <tr>
                    <th className="app-table-head-cell">
                      <button
                        type="button"
                        onClick={() => handleSort("data")}
                        className="inline-flex items-center gap-1"
                      >
                        Data
                        {sortBy === "data" && sortDirection === "asc" ? (
                          <ArrowUpNarrowWide size={14} />
                        ) : sortBy === "data" ? (
                          <ArrowDownWideNarrow size={14} />
                        ) : null}
                      </button>
                    </th>
                    <th className="app-table-head-cell">
                      <button
                        type="button"
                        onClick={() => handleSort("ativo")}
                        className="inline-flex items-center gap-1"
                      >
                        Ativo
                        {sortBy === "ativo" && sortDirection === "asc" ? (
                          <ArrowUpNarrowWide size={14} />
                        ) : sortBy === "ativo" ? (
                          <ArrowDownWideNarrow size={14} />
                        ) : null}
                      </button>
                    </th>
                    <th className="app-table-head-cell">
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
                    <th className="app-table-head-cell-center">
                      <button
                        type="button"
                        onClick={() => handleSort("tipo")}
                        className="inline-flex items-center justify-center gap-1"
                      >
                        Tipo
                        {sortBy === "tipo" && sortDirection === "asc" ? (
                          <ArrowUpNarrowWide size={14} />
                        ) : sortBy === "tipo" ? (
                          <ArrowDownWideNarrow size={14} />
                        ) : null}
                      </button>
                    </th>
                    <th className="app-table-head-cell-right">
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
                    <th className="app-table-head-cell-center">Ações</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {sortedMovimentacoes.map((item) => (
                    <tr key={item.id} className="app-table-row">
                      <td className="px-3 py-2 text-xs text-gray-700">
                        {formatDateBR(item.data)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700">{item.ativo_nome}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{item.banco_nome}</td>
                      <td className="px-3 py-2 text-center text-xs">
                        <div className="flex justify-center">
                          <span
                            className={`${
                              item.tipo === "APORTE"
                                ? "app-badge-info"
                                : item.tipo === "RESGATE"
                                  ? "app-badge-error"
                                  : "app-badge-success"
                            }`}
                          >
                            {tipoLabel[item.tipo]}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                        {formatCurrencyBRL(Number(item.valor))}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        <div className="flex justify-center gap-1">
                          <TableActionButton
                            action="view"
                            title="Visualizar"
                            onClick={() => setViewingMovimentacao(item)}
                            compact
                          />
                          <TableActionButton
                            action="edit"
                            title="Editar"
                            onClick={() => handleEdit(item)}
                            compact
                          />
                          <TableActionButton
                            action="delete"
                            title="Excluir"
                            onClick={() => setDeleteTarget(item)}
                            compact
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && total > 0 && (
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

      {showModal && (
        <InvestimentoMovimentacaoModal
          movimentacao={editingMovimentacao}
          ativos={ativos}
          onClose={() => {
            setShowModal(false);
            setEditingMovimentacao(null);
          }}
          onSave={async (message) => {
            showFeedback("success", message);
            setShowModal(false);
            setEditingMovimentacao(null);
            await loadReferenceData();
            if (currentPage !== 1) {
              setCurrentPage(1);
            } else {
              await loadMovimentacoes();
            }
          }}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirmar exclusão"
        description={
          <>
            Esta ação removerá a movimentação de <strong>{deleteTarget?.ativo_nome}</strong>.
          </>
        }
        confirmLabel="Excluir movimentação"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ViewDataModal
        isOpen={!!viewingMovimentacao}
        title="Visualizar Movimentação"
        data={viewingMovimentacao}
        onClose={() => setViewingMovimentacao(null)}
        fieldLabels={{
          id: "ID da movimentação",
          ativo_nome: "Ativo",
          ativo_status: "Status do ativo",
          banco_nome: "Banco",
          investimento_ativo_id: "ID do ativo",
        }}
      />
    </div>
  );
}

