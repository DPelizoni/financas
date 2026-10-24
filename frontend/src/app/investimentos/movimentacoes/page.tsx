"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
} from "lucide-react";
import { MenuItem, TextField } from "@mui/material";
import AppButton from "@/components/AppButton";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import InvestimentoMovimentacaoModal from "@/components/InvestimentoMovimentacaoModal";
import PageHeader from "@/components/PageHeader";
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
import { formatCurrency, formatDateBR } from "@/utils/format";
import SortableHeader from "@/components/SortableHeader";
import FilterBar from "@/components/FilterBar";
import { FilterChip } from "@/components/FilterChips";
import { parsePositiveInt, useUrlFilterSync } from "@/utils/useUrlFilterSync";
import MonthSwitcher from "@/components/MonthSwitcher";

const tipoLabel: Record<InvestimentoMovimentacaoTipo, string> = {
  APORTE: "Aporte",
  RESGATE: "Resgate",
  RENDIMENTO: "Rendimentos",
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
  // Filtros na URL: permite recarregar, compartilhar e voltar ao mesmo estado
  const filtersReady = useUrlFilterSync(
    (params) => {
      const busca = params.get("busca");
      if (busca) setSearchTerm(busca);
      const mes = params.get("mes");
      if (mes && /^\d{4}-\d{2}$/.test(mes)) setFilterMesAno(mes);
      const ano = params.get("ano");
      if (ano && /^\d{4}$/.test(ano)) setFilterAno(ano);
      const banco = parsePositiveInt(params.get("banco"));
      if (banco) setFilterBanco(banco);
      const tipo = params.get("tipo");
      if (tipo === "APORTE" || tipo === "RESGATE" || tipo === "RENDIMENTO") setFilterTipo(tipo);
      const ativo = parsePositiveInt(params.get("ativo"));
      if (ativo) setFilterAtivo(ativo);
    },
    {
      busca: searchTerm,
      mes: filterMesAno,
      ano: filterAno === "TODOS" ? null : filterAno,
      banco: filterBanco === "TODOS" ? null : String(filterBanco),
      tipo: filterTipo === "TODOS" ? null : filterTipo,
      ativo: filterAtivo === "TODOS" ? null : String(filterAtivo),
    },
  );

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

  const { data: movsData, isLoading: loadingQuery, isFetching } = useQuery({
    queryKey: ["movimentacoes", queryFilters],
    enabled: filtersReady,
    queryFn: () => investimentoMovimentacaoService.getAll(queryFilters),
    placeholderData: (prev) => prev,
  });
  const loading = loadingQuery || !filtersReady;

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const filterChips: FilterChip[] = [];
  if (searchTerm) {
    filterChips.push({ key: "busca", label: `Busca: “${searchTerm}”`, onRemove: () => handleSearchChange("") });
  }
  if (filterAno !== "TODOS" && !filterMesAno) {
    filterChips.push({ key: "ano", label: `Ano: ${filterAno}`, onRemove: () => { setFilterAno("TODOS"); setCurrentPage(1); } });
  }
  if (filterBanco !== "TODOS") {
    const nome = banks.find((bank) => bank.id === filterBanco)?.nome ?? `#${filterBanco}`;
    filterChips.push({ key: "banco", label: `Banco: ${nome}`, onRemove: () => { setFilterBanco("TODOS"); setCurrentPage(1); } });
  }
  if (filterTipo !== "TODOS") {
    filterChips.push({ key: "tipo", label: `Tipo: ${tipoLabel[filterTipo]}`, onRemove: () => { setFilterTipo("TODOS"); setCurrentPage(1); } });
  }
  if (filterAtivo !== "TODOS") {
    const nome = ativos.find((ativo) => ativo.id === filterAtivo)?.nome ?? `#${filterAtivo}`;
    filterChips.push({ key: "ativo", label: `Ativo: ${nome}`, onRemove: () => { setFilterAtivo("TODOS"); setCurrentPage(1); } });
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Movimentações"
          description="Lançamentos de aportes, resgates e rendimentos."
          actions={
            <>
              <AppButton onClick={() => { setEditingMovimentacao(null); setShowModal(true); }} tone="primary" startIcon={<Plus size={18} />} className="w-full sm:w-auto">Nova Movimentação</AppButton>
            </>
          }
        />

        <FilterBar
          label="Filtros de movimentações"
          leading={<MonthSwitcher value={filterMesAno} onChange={(value) => { setFilterMesAno(value); setCurrentPage(1); }} allowAll />}
          search={{ value: searchTerm, onChange: handleSearchChange, placeholder: "Buscar movimentação" }}
          advancedCount={(filterAno !== "TODOS" && !filterMesAno ? 1 : 0) + (filterBanco !== "TODOS" ? 1 : 0) + (filterTipo !== "TODOS" ? 1 : 0) + (filterAtivo !== "TODOS" ? 1 : 0)}
          chips={filterChips}
          onClearAll={handleClearFilters}
          advanced={
            <>
              <TextField select label="Ano" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterAno} onChange={(e) => { setFilterAno(e.target.value); setCurrentPage(1); }} disabled={Boolean(filterMesAno)}><MenuItem value="TODOS">Todos</MenuItem>{availableYears.map((year) => (<MenuItem key={year} value={year}>{year}</MenuItem>))}</TextField>

              <TextField select label="Banco" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterBanco} onChange={(e) => { setFilterBanco(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value)); setCurrentPage(1); }}><MenuItem value="TODOS">Todos</MenuItem>{sortedBanks.map((bank) => (<MenuItem key={bank.id} value={bank.id}>{bank.nome}</MenuItem>))}</TextField>

              <TextField select label="Tipo" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value as any); setCurrentPage(1); }}><MenuItem value="TODOS">Todos</MenuItem><MenuItem value="APORTE">Aporte</MenuItem><MenuItem value="RESGATE">Resgate</MenuItem><MenuItem value="RENDIMENTO">Rendimentos</MenuItem></TextField>

              <TextField select label="Ativo" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterAtivo} onChange={(e) => { setFilterAtivo(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value)); setCurrentPage(1); }}><MenuItem value="TODOS">Todos</MenuItem>{sortedAtivos.map((ativo) => (<MenuItem key={ativo.id} value={ativo.id}>{ativo.nome}</MenuItem>))}</TextField>
            </>
          }
        />

        <div className={`app-surface p-4 transition-opacity duration-200 ${isFetching && !loading ? "opacity-50" : "opacity-100"}`}>
          {loading ? (
            <><div className="md:hidden"><CardSkeleton count={3} /></div><div className="hidden md:block"><TableSkeleton rows={5} columns={5} /></div></>
          ) : sortedMovimentacoes.length === 0 ? (
            <EmptyState icon={Search} title="Nenhuma movimentação encontrada" description={activeFiltersCount > 0 ? "Tente ajustar seus filtros para encontrar o que procura." : "Comece registrando seus aportes e rendimentos."} actionLabel={activeFiltersCount > 0 ? "Limpar Filtros" : "Nova Movimentação"} onAction={activeFiltersCount > 0 ? handleClearFilters : () => { setEditingMovimentacao(null); setShowModal(true); }} />
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {sortedMovimentacoes.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-semibold text-gray-900">{item.ativo_nome}</p><p className="mt-1 text-xs text-gray-600">Data: {formatDateBR(item.data)}</p><p className="mt-1 text-xs text-gray-600">Banco: {item.banco_nome || "-"}</p></div>
                      <span className={`${item.tipo === "APORTE" ? "app-badge-info" : item.tipo === "RESGATE" ? "app-badge-error" : "app-badge-success"}`}>{tipoLabel[item.tipo]}</span>
                    </div>
                    <div className="mt-3 text-xs text-gray-700"><span className="font-medium">Valor: </span><span className="font-semibold text-gray-900">{formatCurrency(Number(item.valor))}</span></div>
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3"><TableActionButton action="view" title="Visualizar" onClick={() => setViewingMovimentacao(item)} /><TableActionButton action="edit" title="Editar" onClick={() => { setEditingMovimentacao(item); setShowModal(true); }} /><TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(item)} /></div>
                  </div>
                ))}
              </div>

              <div className="app-table-scroll hidden md:block">
                <table className="w-full table-fixed divide-y divide-gray-200 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <SortableHeader label="Data" column="data" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[12%]" />
                      <SortableHeader label="Ativo" column="ativo" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[25%]" />
                      <SortableHeader label="Banco" column="banco" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="hidden w-[20%] xl:table-cell" />
                      <SortableHeader label="Tipo" column="tipo" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="center" className="w-[12%]" />
                      <SortableHeader label="Valor" column="valor" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" className="w-[15%]" />
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
                        <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900">{formatCurrency(Number(item.valor))}</td>
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
