"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Filter,
  Search,
  X,
} from "lucide-react";
import { InputAdornment, MenuItem, TextField } from "@mui/material";
import Icon from "@mdi/react";
import { mdiPlusBoxOutline } from "@mdi/js";
import AppButton from "@/components/AppButton";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
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
import {
  InvestimentoMovimentacao,
  InvestimentoMovimentacaoTipo,
} from "@/types/investimento";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(parsed);
};

const toIsoDate = (date: Date): string => {
  const timezoneOffsetInMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetInMs).toISOString().slice(0, 10);
};

const getDateRangeByFilters = ({ filterMesAno, filterAno }: { filterMesAno: string; filterAno: string; }): { data_de?: string; data_ate?: string } => {
  if (/^\d{4}-\d{2}$/.test(filterMesAno)) {
    const [yearValue, monthValue] = filterMesAno.split("-").map(Number);
    return { data_de: toIsoDate(new Date(yearValue, monthValue - 1, 1)), data_ate: toIsoDate(new Date(yearValue, monthValue, 0)) };
  }
  if (filterAno !== "TODOS") {
    const selectedYear = Number(filterAno);
    if (!Number.isNaN(selectedYear)) return { data_de: toIsoDate(new Date(selectedYear, 0, 1)), data_ate: toIsoDate(new Date(selectedYear, 11, 31)) };
  }
  return {};
};

export default function InvestimentosMovimentacoesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMesAno, setFilterMesAno] = useState("");
  const [filterAno, setFilterAno] = useState<string>("TODOS");
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [filterTipo, setFilterTipo] = useState<InvestimentoMovimentacaoTipo | "TODOS">("TODOS");
  const [filterAtivo, setFilterAtivo] = useState<number | "TODOS">("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"data" | "tipo" | "ativo" | "banco" | "valor">("data");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [editingMovimentacao, setEditingMovimentacao] = useState<InvestimentoMovimentacao | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InvestimentoMovimentacao | null>(null);
  const [viewingMovimentacao, setViewingMovimentacao] = useState<InvestimentoMovimentacao | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // TanStack Queries
  const { data: referenceData } = useQuery({
    queryKey: ["investimentos-reference"],
    queryFn: async () => {
      const [banksRes, ativosRes] = await Promise.all([
        bankService.getAll({ page: 1, limit: 999 }),
        investimentoAtivoService.getAll({ page: 1, limit: 999 }),
      ]);
      return { banks: banksRes.data || [], ativos: ativosRes.data || [] };
    }
  });
  const banks = referenceData?.banks || [];
  const ativos = referenceData?.ativos || [];

  const { data: availableYears = [] } = useQuery({
    queryKey: ["invest-available-years", filterBanco],
    queryFn: () => investimentoDashboardService.getAvailableYears({ banco_id: filterBanco === "TODOS" ? undefined : filterBanco }),
  });

  const queryFilters = useMemo(() => {
    const dateRange = getDateRangeByFilters({ filterMesAno, filterAno });
    return {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
      tipo: filterTipo === "TODOS" ? undefined : filterTipo,
      investimento_ativo_id: filterAtivo === "TODOS" ? undefined : filterAtivo,
      data_de: dateRange.data_de,
      data_ate: dateRange.data_ate,
    };
  }, [currentPage, itemsPerPage, searchTerm, filterMesAno, filterAno, filterBanco, filterTipo, filterAtivo]);

  const { data: movsData, isLoading: loading, isFetching } = useQuery({
    queryKey: ["movimentacoes", queryFilters],
    queryFn: () => investimentoMovimentacaoService.getAll(queryFilters),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => investimentoMovimentacaoService.delete(id),
    onSuccess: () => {
      toast.success("Movimentação excluída com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      setDeleteTarget(null);
    }
  });

  const movimentacoes = movsData?.data || [];
  const total = movsData?.pagination?.total || 0;
  const totalPages = movsData?.pagination?.totalPages || 1;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterMesAno) count++;
    if (filterAno !== "TODOS" && !filterMesAno) count++;
    if (filterBanco !== "TODOS") count++;
    if (filterTipo !== "TODOS") count++;
    if (filterAtivo !== "TODOS") count++;
    return count;
  }, [searchTerm, filterMesAno, filterAno, filterBanco, filterTipo, filterAtivo]);

  const sortedBanks = useMemo(() => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [banks]);
  const sortedAtivos = useMemo(() => [...ativos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [ativos]);

  const sortedMovimentacoes = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...movimentacoes].sort((a, b) => {
      if (sortBy === "data") return a.data.localeCompare(b.data) * direction;
      if (sortBy === "tipo") return a.tipo.localeCompare(b.tipo, "pt-BR") * direction;
      if (sortBy === "ativo") return (a.ativo_nome || "").localeCompare(b.ativo_nome || "", "pt-BR") * direction;
      if (sortBy === "banco") return (a.banco_nome || "").localeCompare(b.banco_nome || "", "pt-BR") * direction;
      return (Number(a.valor) - Number(b.valor)) * direction;
    });
  }, [movimentacoes, sortBy, sortDirection]);

  const handleSort = (column: any) => {
    if (sortBy === column) { setSortDirection((prev) => (prev === "asc" ? "desc" : "asc")); return; }
    setSortBy(column); setSortDirection(column === "data" ? "desc" : "asc");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterMesAno("");
    setFilterAno("TODOS");
    setFilterBanco("TODOS");
    setFilterTipo("TODOS");
    setFilterAtivo("TODOS");
    setCurrentPage(1);
  };

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Movimentações de Investimento</h1><p className="mt-2 text-sm text-gray-600">Lançamentos de aportes, resgates e rendimentos.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <AppButton
                tone={showFilters ? "outline-primary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
                startIcon={<Filter size={18} />}
              >
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
                {activeFiltersCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                    {activeFiltersCount}
                  </span>
                )}
              </AppButton>
              <AppButton onClick={() => { setEditingMovimentacao(null); setShowModal(true); }} tone="primary" startIcon={<Icon path={mdiPlusBoxOutline} size={0.8} />} className="w-full sm:w-auto">Nova Movimentação</AppButton>
            </div>
          </div>
        </PageContainer>

        <div className={`filter-panel-surface ${!showFilters ? "hidden" : "block animate-in fade-in slide-in-from-top-2 duration-300"}`}>
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3"><h3 className="text-sm font-semibold text-gray-700">Filtros de Movimentação</h3><button type="button" onClick={handleClearFilters} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition">Limpar tudo</button></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField type="text" label="Buscar" variant="outlined" size="small" fullWidth value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={16} className="text-gray-400" /></InputAdornment>), endAdornment: searchTerm ? (<InputAdornment position="end"><button type="button" onClick={() => { setSearchTerm(""); setCurrentPage(1); }} className="rounded p-1 hover:bg-gray-100"><X size={14} /></button></InputAdornment>) : undefined }} />
            <TextField type="month" label="Mês/Ano" variant="outlined" size="small" fullWidth value={filterMesAno} onChange={(e) => { setFilterMesAno(e.target.value); setCurrentPage(1); }} InputLabelProps={{ shrink: true }} />
            <TextField select label="Ano" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterAno} onChange={(e) => { setFilterAno(e.target.value); setCurrentPage(1); }} disabled={Boolean(filterMesAno)}><MenuItem value="TODOS">Todos</MenuItem>{availableYears.map((year) => (<MenuItem key={year} value={year}>{year}</MenuItem>))}</TextField>
            <TextField select label="Bancos" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterBanco} onChange={(e) => { setFilterBanco(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value)); setCurrentPage(1); }}><MenuItem value="TODOS">Todos</MenuItem>{sortedBanks.map((bank) => (<MenuItem key={bank.id} value={bank.id}>{bank.nome}</MenuItem>))}</TextField>
            <TextField select label="Tipo" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value as any); setCurrentPage(1); }}><MenuItem value="TODOS">Todos</MenuItem><MenuItem value="APORTE">Aporte</MenuItem><MenuItem value="RESGATE">Resgate</MenuItem><MenuItem value="RENDIMENTO">Rendimentos</MenuItem></TextField>
            <TextField select label="Ativo" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterAtivo} onChange={(e) => { setFilterAtivo(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value)); setCurrentPage(1); }}><MenuItem value="TODOS">Todos</MenuItem>{sortedAtivos.map((ativo) => (<MenuItem key={ativo.id} value={ativo.id}>{ativo.nome}</MenuItem>))}</TextField>
          </div>
        </div>

        <div className={`app-surface p-4 transition-opacity duration-200 ${isFetching && !loading ? "opacity-50" : "opacity-100"}`}>
          {loading ? (
            <><div className="md:hidden"><CardSkeleton count={3} /></div><div className="hidden md:block"><TableSkeleton rows={5} columns={5} /></div></>
          ) : sortedMovimentacoes.length === 0 ? (
            <EmptyState icon={Search} title="Nenhuma movimentação encontrada" description={activeFiltersCount > 0 ? "Tente ajustar seus filtros para encontrar o que procura." : "Comece registrando seus aportes e rendimentos."} actionLabel={activeFiltersCount > 0 ? "Limpar Filtros" : "Nova Movimentação"} onAction={activeFiltersCount > 0 ? handleClearFilters : () => { setEditingMovimentacao(null); setShowModal(true); }} />
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {sortedMovimentacoes.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-semibold text-gray-900">{item.ativo_nome}</p><p className="mt-1 text-xs text-gray-600">Data: {formatDateBR(item.data)}</p><p className="mt-1 text-xs text-gray-600">Banco: {item.banco_nome || "-"}</p></div>
                      <span className={`${item.tipo === "APORTE" ? "app-badge-info" : item.tipo === "RESGATE" ? "app-badge-error" : "app-badge-success"}`}>{tipoLabel[item.tipo]}</span>
                    </div>
                    <div className="mt-3 text-xs text-gray-700"><span className="font-medium">Valor: </span><span className="font-semibold text-gray-900">{formatCurrencyBRL(Number(item.valor))}</span></div>
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3"><TableActionButton action="view" title="Visualizar" onClick={() => setViewingMovimentacao(item)} /><TableActionButton action="edit" title="Editar" onClick={() => { setEditingMovimentacao(item); setShowModal(true); }} /><TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(item)} /></div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full table-fixed divide-y divide-gray-200 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <th className="app-table-head-cell w-[12%]"><button type="button" onClick={() => handleSort("data")} className="inline-flex items-center gap-1">Data{sortBy === "data" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} /> : sortBy === "data" ? <ArrowDownWideNarrow size={14} /> : null}</button></th>
                      <th className="app-table-head-cell w-[25%]"><button type="button" onClick={() => handleSort("ativo")} className="inline-flex items-center gap-1">Ativo{sortBy === "ativo" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} /> : sortBy === "ativo" ? <ArrowDownWideNarrow size={14} /> : null}</button></th>
                      <th className="app-table-head-cell hidden w-[20%] xl:table-cell"><button type="button" onClick={() => handleSort("banco")} className="inline-flex items-center gap-1">Banco{sortBy === "banco" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} /> : sortBy === "banco" ? <ArrowDownWideNarrow size={14} /> : null}</button></th>
                      <th className="app-table-head-cell-center w-[12%]"><button type="button" onClick={() => handleSort("tipo")} className="inline-flex items-center justify-center gap-1">Tipo{sortBy === "tipo" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} /> : sortBy === "tipo" ? <ArrowDownWideNarrow size={14} /> : null}</button></th>
                      <th className="app-table-head-cell-right w-[15%]"><button type="button" onClick={() => handleSort("valor")} className="inline-flex items-center gap-1">Valor{sortBy === "valor" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} /> : sortBy === "valor" ? <ArrowDownWideNarrow size={14} /> : null}</button></th>
                      <th className="app-table-head-cell-center w-[16%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {sortedMovimentacoes.map((item) => (
                      <tr key={item.id} className="app-table-row">
                        <td className="px-3 py-2 text-xs text-gray-700">{formatDateBR(item.data)}</td>
                        <td className="px-3 py-2 text-xs text-gray-700"><span className="block truncate" title={item.ativo_nome || "-"}>{item.ativo_nome || "-"}</span></td>
                        <td className="hidden px-3 py-2 text-xs text-gray-700 xl:table-cell"><span className="block truncate" title={item.banco_nome || "-"}>{item.banco_nome || "-"}</span></td>
                        <td className="px-3 py-2 text-center text-xs"><div className="flex justify-center"><span className={`${item.tipo === "APORTE" ? "app-badge-info" : item.tipo === "RESGATE" ? "app-badge-error" : "app-badge-success"}`}>{tipoLabel[item.tipo]}</span></div></td>
                        <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900">{formatCurrencyBRL(Number(item.valor))}</td>
                        <td className="px-3 py-2 text-center text-xs"><div className="flex justify-center gap-1"><TableActionButton action="view" title="Visualizar" onClick={() => setViewingMovimentacao(item)} compact /><TableActionButton action="edit" title="Editar" onClick={() => { setEditingMovimentacao(item); setShowModal(true); }} compact /><TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(item)} compact /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {!loading && total > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} total={total} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} itemsPerPageOptions={[5, 10, 20, 50, 100]} centeredLayout />}
      </div>

      <InvestimentoMovimentacaoModal isOpen={showModal} movimentacao={editingMovimentacao} ativos={ativos} onClose={() => { setShowModal(false); setEditingMovimentacao(null); }} onSave={async (message) => { toast.success(message); queryClient.invalidateQueries({ queryKey: ["movimentacoes"] }); setShowModal(false); setEditingMovimentacao(null); }} />

      <ConfirmDeleteModal isOpen={!!deleteTarget} title="Confirmar exclusão" description={<>Esta ação removerá a movimentação de <strong>{deleteTarget?.ativo_nome}</strong>.</>} confirmLabel="Excluir movimentação" onCancel={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate(deleteTarget!.id)} />

      <ViewDataModal 
        isOpen={!!viewingMovimentacao} 
        title="Visualizar Movimentação" 
        data={viewingMovimentacao} 
        onClose={() => setViewingMovimentacao(null)} 
        fieldLabels={{ id: "ID da movimentação", ativo_nome: "Ativo", ativo_status: "Status do ativo", banco_nome: "Banco", investimento_ativo_id: "ID do ativo" }} 
        hideCopy={true}
      />
    </div>
  );
}
