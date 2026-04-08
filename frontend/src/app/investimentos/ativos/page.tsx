"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search, Wallet, X } from "lucide-react";
import { InputAdornment, MenuItem, TextField } from "@mui/material";
import Icon from "@mdi/react";
import { mdiPlusBoxOutline } from "@mdi/js";
import AppButton from "@/components/AppButton";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import FeedbackAlert from "@/components/FeedbackAlert";
import InvestimentoAtivoModal from "@/components/InvestimentoAtivoModal";
import PageContainer from "@/components/PageContainer";
import Pagination from "@/components/Pagination";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { bankService } from "@/services/bankService";
import { investimentoAtivoService } from "@/services/investimentoService";
import { Bank } from "@/types/bank";
import { InvestimentoAtivo, InvestimentoAtivoFilters } from "@/types/investimento";

type AtivoFilter = "TODOS" | "ATIVOS" | "INATIVOS";

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

const getDateRangeByYear = (filterAno: string): { data_de?: string; data_ate?: string } => {
  if (filterAno === "TODOS") {
    return {};
  }

  const selectedYear = Number(filterAno);
  if (Number.isNaN(selectedYear)) {
    return {};
  }

  return {
    data_de: toIsoDate(new Date(selectedYear, 0, 1)),
    data_ate: toIsoDate(new Date(selectedYear, 11, 31)),
  };
};

export default function InvestimentosAtivosPage() {
  const [loading, setLoading] = useState(true);
  const [ativos, setAtivos] = useState<InvestimentoAtivo[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAno, setFilterAno] = useState<string>("TODOS");
  const [filterAtivo, setFilterAtivo] = useState<AtivoFilter>("TODOS");
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<
    | "data_saldo_inicial"
    | "nome"
    | "banco"
    | "saldo_inicial"
    | "saldo_atual"
    | "status"
  >("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [editingAtivo, setEditingAtivo] = useState<InvestimentoAtivo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InvestimentoAtivo | null>(null);
  const [viewingAtivo, setViewingAtivo] = useState<InvestimentoAtivo | null>(null);

  const sortedBanks = useMemo(
    () => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [banks],
  );

  const sortedAtivos = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...ativos].sort((a, b) => {
      if (sortBy === "data_saldo_inicial") {
        const firstDate = new Date(a.data_saldo_inicial).getTime();
        const secondDate = new Date(b.data_saldo_inicial).getTime();
        if (Number.isNaN(firstDate) || Number.isNaN(secondDate)) {
          return a.data_saldo_inicial.localeCompare(b.data_saldo_inicial) * direction;
        }
        return (firstDate - secondDate) * direction;
      }
      if (sortBy === "nome") {
        return a.nome.localeCompare(b.nome, "pt-BR") * direction;
      }
      if (sortBy === "banco") {
        return (a.banco_nome || "").localeCompare(b.banco_nome || "", "pt-BR") * direction;
      }
      if (sortBy === "saldo_inicial") {
        return (
          (Number(a.saldo_inicial || 0) - Number(b.saldo_inicial || 0)) * direction
        );
      }
      if (sortBy === "saldo_atual") {
        return (Number(a.saldo_atual || 0) - Number(b.saldo_atual || 0)) * direction;
      }
      return Number(a.ativo === true) === Number(b.ativo === true)
        ? 0
        : (a.ativo ? 1 : -1) * direction;
    });
  }, [ativos, sortBy, sortDirection]);

  const handleSort = (
    column:
      | "data_saldo_inicial"
      | "nome"
      | "banco"
      | "saldo_inicial"
      | "saldo_atual"
      | "status",
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

  const loadBanks = async () => {
    try {
      const response = await bankService.getAll({ page: 1, limit: 999 });
      setBanks(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
    }
  };

  const loadAtivos = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRangeByYear(filterAno);

      const filters: InvestimentoAtivoFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
        ativo:
          filterAtivo === "ATIVOS"
            ? true
            : filterAtivo === "INATIVOS"
              ? false
              : undefined,
        data_de: dateRange.data_de,
        data_ate: dateRange.data_ate,
      };

      const response = await investimentoAtivoService.getAll(filters);
      setAtivos(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Erro ao carregar ativos:", error);
      showFeedback("error", "Não foi possível carregar os ativos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const years = await investimentoAtivoService.getAvailableYears({
          banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
          ativo:
            filterAtivo === "ATIVOS"
              ? true
              : filterAtivo === "INATIVOS"
                ? false
                : undefined,
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
  }, [filterBanco, filterAtivo, filterAno]);

  useEffect(() => {
    loadAtivos();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    filterAno,
    filterAtivo,
    filterBanco,
  ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterAno("TODOS");
    setFilterAtivo("TODOS");
    setFilterBanco("TODOS");
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setEditingAtivo(null);
    setShowModal(true);
  };

  const handleEdit = (ativo: InvestimentoAtivo) => {
    setEditingAtivo(ativo);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await investimentoAtivoService.delete(deleteTarget.id);
      showFeedback("success", "Ativo excluído com sucesso.");
      setDeleteTarget(null);
      await loadAtivos();
    } catch (error) {
      console.error("Erro ao excluir ativo:", error);
      const apiMessage = (error as any)?.response?.data?.message;
      showFeedback("error", apiMessage || "Não foi possível excluir o ativo.");
    }
  };

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                <Wallet size={32} className="text-blue-600" />
                Cadastro de Ativos
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Cadastre e mantenha os ativos da carteira de investimentos.
              </p>
            </div>
            <AppButton
              onClick={handleCreate}
              tone="primary"
              startIcon={<Icon path={mdiPlusBoxOutline} size={0.8} />}
              className="w-full sm:w-auto"
            >
              Novo Ativo
            </AppButton>
          </div>
        </PageContainer>

        <div className="filter-panel-surface">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <TextField
              type="text"
              label="Buscar ativo"
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
              label="Status"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterAtivo}
              onChange={(e) => {
                setFilterAtivo(e.target.value as AtivoFilter);
                setCurrentPage(1);
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="ATIVOS">Ativos</MenuItem>
              <MenuItem value="INATIVOS">Inativos</MenuItem>
            </TextField>

            <TextField
              select
              label="Banco"
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
          ) : sortedAtivos.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-600">
              Nenhum ativo encontrado com os filtros atuais.
            </div>
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 lg:hidden">
                {sortedAtivos.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.nome}</p>
                        <p className="mt-1 text-xs text-gray-600">
                          Início: {formatDateBR(item.data_saldo_inicial)}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          Banco: {item.banco_nome || "-"}
                        </p>
                      </div>

                      {item.ativo ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-gray-700">
                      <p>
                        <span className="font-medium">Saldo inicial: </span>
                        {formatCurrencyBRL(Number(item.saldo_inicial))}
                      </p>
                      <p>
                        <span className="font-medium">Saldo atual: </span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrencyBRL(Number(item.saldo_atual || 0))}
                        </span>
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                      <TableActionButton
                        action="view"
                        title="Visualizar"
                        onClick={() => setViewingAtivo(item)}
                      />
                      <TableActionButton
                        action="edit"
                        title="Editar"
                        onClick={() => handleEdit(item)}
                      />
                      <TableActionButton
                        action="delete"
                        title="Excluir"
                        onClick={() => setDeleteTarget(item)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-[860px] w-full divide-y divide-gray-200 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <th className="app-table-head-cell">
                        <button
                          type="button"
                          onClick={() => handleSort("data_saldo_inicial")}
                          className="inline-flex items-center gap-1"
                        >
                          Início Ativo
                          {sortBy === "data_saldo_inicial" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "data_saldo_inicial" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell">
                        <button
                          type="button"
                          onClick={() => handleSort("nome")}
                          className="inline-flex items-center gap-1"
                        >
                          Ativo
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
                      <th className="app-table-head-cell-right">
                        <button
                          type="button"
                          onClick={() => handleSort("saldo_inicial")}
                          className="inline-flex items-center gap-1"
                        >
                          Saldo Inicial
                          {sortBy === "saldo_inicial" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "saldo_inicial" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell-right">
                        <button
                          type="button"
                          onClick={() => handleSort("saldo_atual")}
                          className="inline-flex items-center gap-1"
                        >
                          Saldo Atual
                          {sortBy === "saldo_atual" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "saldo_atual" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell-center">
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
                      <th className="app-table-head-cell-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {sortedAtivos.map((item) => (
                      <tr key={item.id} className="app-table-row">
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {formatDateBR(item.data_saldo_inicial)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700">{item.nome}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {item.banco_nome || "-"}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-gray-700">
                          {formatCurrencyBRL(Number(item.saldo_inicial))}
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                          {formatCurrencyBRL(Number(item.saldo_atual || 0))}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {item.ativo ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          <div className="flex justify-center gap-1">
                            <TableActionButton
                              action="view"
                              title="Visualizar"
                              onClick={() => setViewingAtivo(item)}
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
            </>
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
        <InvestimentoAtivoModal
          ativo={editingAtivo}
          banks={sortedBanks}
          onClose={() => {
            setShowModal(false);
            setEditingAtivo(null);
          }}
          onSave={async (message) => {
            showFeedback("success", message);
            setShowModal(false);
            setEditingAtivo(null);
            if (currentPage !== 1) {
              setCurrentPage(1);
            } else {
              await loadAtivos();
            }
          }}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirmar exclusão"
        description={
          <>
            Esta ação removerá o ativo <strong>{deleteTarget?.nome}</strong>.
          </>
        }
        confirmLabel="Excluir ativo"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ViewDataModal
        isOpen={!!viewingAtivo}
        title="Visualizar Ativo"
        data={viewingAtivo}
        onClose={() => setViewingAtivo(null)}
        fieldLabels={{
          data_saldo_inicial: "Data do saldo inicial",
          total_aporte: "Total de aporte",
          total_resgate: "Total de resgate",
          total_rendimento: "Total de rendimentos",
          saldo_atual: "Saldo atual",
        }}
      />
    </div>
  );
}
