"use client";

import { useMemo, useState } from "react";
import { Wallet, Plus } from "lucide-react";
import { MenuItem, TextField } from "@mui/material";
import AppButton from "@/components/AppButton";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import InvestimentoAtivoModal from "@/components/InvestimentoAtivoModal";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { bankService } from "@/services/bankService";
import { investimentoAtivoService } from "@/services/investimentoService";
import { Bank } from "@/types/bank";
import { InvestimentoAtivo, InvestimentoAtivoFilters } from "@/types/investimento";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCurrency, formatDateBR } from "@/utils/format";
import ActiveBadge from "@/components/ActiveBadge";
import SortableHeader from "@/components/SortableHeader";
import FilterBar from "@/components/FilterBar";
import { FilterChip } from "@/components/FilterChips";
import { parsePositiveInt, useUrlFilterSync } from "@/utils/useUrlFilterSync";

type AtivoFilter = "TODOS" | "ATIVOS" | "INATIVOS";

const toIsoDate = (date: Date): string => {
  const timezoneOffsetInMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetInMs).toISOString().slice(0, 10);
};

const getDateRangeByYear = (filterAno: string): { data_de?: string; data_ate?: string } => {
  if (filterAno === "TODOS") return {};
  const selectedYear = Number(filterAno);
  if (Number.isNaN(selectedYear)) return {};
  return {
    data_de: toIsoDate(new Date(selectedYear, 0, 1)),
    data_ate: toIsoDate(new Date(selectedYear, 11, 31)),
  };
};

export default function InvestimentosAtivosPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAno, setFilterAno] = useState<string>("TODOS");
  const [filterAtivo, setFilterAtivo] = useState<AtivoFilter>("TODOS");
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState<InvestimentoAtivo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvestimentoAtivo | null>(null);
  const [viewingAtivo, setViewingAtivo] = useState<InvestimentoAtivo | null>(null);
  // Filtros na URL: permite recarregar, compartilhar e voltar ao mesmo estado
  const filtersReady = useUrlFilterSync(
    (params) => {
      const busca = params.get("busca");
      if (busca) setSearchTerm(busca);
      const ano = params.get("ano");
      if (ano && /^\d{4}$/.test(ano)) setFilterAno(ano);
      const status = params.get("status");
      if (status === "ATIVOS" || status === "INATIVOS") setFilterAtivo(status);
      const banco = parsePositiveInt(params.get("banco"));
      if (banco) setFilterBanco(banco);
    },
    {
      busca: searchTerm,
      ano: filterAno === "TODOS" ? null : filterAno,
      status: filterAtivo === "TODOS" ? null : filterAtivo,
      banco: filterBanco === "TODOS" ? null : String(filterBanco),
    },
  );
  const [sortBy, setSortBy] = useState<"data_saldo_inicial" | "nome" | "banco" | "saldo_inicial" | "saldo_atual" | "status">("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // TanStack Queries
  const { data: banksData } = useQuery({
    queryKey: ["banks-reference"],
    queryFn: () => bankService.getAll({ page: 1, limit: 999 }),
  });
  const banks = banksData?.data || [];

  const { data: availableYears = [] } = useQuery({
    queryKey: ["ativos-available-years", filterBanco, filterAtivo],
    queryFn: () => investimentoAtivoService.getAvailableYears({
      banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
      ativo: filterAtivo === "ATIVOS" ? true : filterAtivo === "INATIVOS" ? false : undefined,
    }),
  });

  const queryFilters = useMemo(() => {
    const dateRange = getDateRangeByYear(filterAno);
    return {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      banco_id: filterBanco === "TODOS" ? undefined : filterBanco,
      ativo: filterAtivo === "ATIVOS" ? true : filterAtivo === "INATIVOS" ? false : undefined,
      data_de: dateRange.data_de,
      data_ate: dateRange.data_ate,
    };
  }, [currentPage, itemsPerPage, searchTerm, filterAno, filterAtivo, filterBanco]);

  const { data: ativosData, isLoading: loadingQuery, isFetching } = useQuery({
    queryKey: ["ativos", queryFilters],
    enabled: filtersReady,
    queryFn: () => investimentoAtivoService.getAll(queryFilters),
    placeholderData: (prev) => prev,
  });
  const loading = loadingQuery || !filtersReady;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => investimentoAtivoService.delete(id),
    onSuccess: () => {
      toast.success("Ativo excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["ativos"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Não foi possível excluir o ativo.");
    }
  });

  const ativos = ativosData?.data || [];
  const total = ativosData?.pagination?.total || 0;
  const totalPages = ativosData?.pagination?.totalPages || 1;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterAno !== "TODOS") count++;
    if (filterAtivo !== "TODOS") count++;
    if (filterBanco !== "TODOS") count++;
    return count;
  }, [searchTerm, filterAno, filterAtivo, filterBanco]);

  const sortedBanks = useMemo(() => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [banks]);

  const sortedAtivos = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...ativos].sort((a, b) => {
      if (sortBy === "data_saldo_inicial") return a.data_saldo_inicial.localeCompare(b.data_saldo_inicial) * direction;
      if (sortBy === "nome") return a.nome.localeCompare(b.nome, "pt-BR") * direction;
      if (sortBy === "banco") return (a.banco_nome || "").localeCompare(b.banco_nome || "", "pt-BR") * direction;
      if (sortBy === "saldo_inicial") return (Number(a.saldo_inicial || 0) - Number(b.saldo_inicial || 0)) * direction;
      if (sortBy === "saldo_atual") return (Number(a.saldo_atual || 0) - Number(b.saldo_atual || 0)) * direction;
      return Number(a.ativo === true) === Number(b.ativo === true) ? 0 : (a.ativo ? 1 : -1) * direction;
    });
  }, [ativos, sortBy, sortDirection]);

  const handleSort = (column: any) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDirection("asc");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterAno("TODOS");
    setFilterAtivo("TODOS");
    setFilterBanco("TODOS");
    setCurrentPage(1);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  };

  const handleEdit = (ativo: InvestimentoAtivo) => {
    setEditingAtivo(ativo);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingAtivo(null);
    setShowModal(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const filterChips: FilterChip[] = [];
  if (searchTerm) {
    filterChips.push({ key: "busca", label: `Busca: “${searchTerm}”`, onRemove: () => handleSearchChange("") });
  }
  if (filterAno !== "TODOS") {
    filterChips.push({ key: "ano", label: `Ano: ${filterAno}`, onRemove: () => { setFilterAno("TODOS"); setCurrentPage(1); } });
  }
  if (filterAtivo !== "TODOS") {
    filterChips.push({ key: "status", label: `Status: ${filterAtivo === "ATIVOS" ? "Ativos" : "Inativos"}`, onRemove: () => { setFilterAtivo("TODOS"); setCurrentPage(1); } });
  }
  if (filterBanco !== "TODOS") {
    const nome = banks.find((bank) => bank.id === filterBanco)?.nome ?? `#${filterBanco}`;
    filterChips.push({ key: "banco", label: `Banco: ${nome}`, onRemove: () => { setFilterBanco("TODOS"); setCurrentPage(1); } });
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Ativos"
          description="Registre e mantenha os ativos da carteira de investimentos."
          actions={
            <>
              <AppButton onClick={handleCreate} tone="primary" startIcon={<Plus size={18} />} className="w-full sm:w-auto">Novo Ativo</AppButton>
            </>
          }
        />

        <FilterBar
          label="Filtros de ativos"
          search={{ value: searchTerm, onChange: handleSearchChange, placeholder: "Buscar ativo por nome" }}
          advancedCount={(filterAno !== "TODOS" ? 1 : 0) + (filterAtivo !== "TODOS" ? 1 : 0) + (filterBanco !== "TODOS" ? 1 : 0)}
          chips={filterChips}
          onClearAll={handleClearFilters}
          advanced={
            <>
              <TextField select label="Ano" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterAno} onChange={(e) => { setFilterAno(e.target.value); setCurrentPage(1); }}>
                <MenuItem value="TODOS">Todos</MenuItem>
                {availableYears.map((year) => (<MenuItem key={year} value={year}>{year}</MenuItem>))}
              </TextField>

              <TextField select label="Status" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterAtivo} onChange={(e) => { setFilterAtivo(e.target.value as AtivoFilter); setCurrentPage(1); }}>
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="ATIVOS">Ativos</MenuItem>
                <MenuItem value="INATIVOS">Inativos</MenuItem>
              </TextField>

              <TextField select label="Banco" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filterBanco} onChange={(e) => { setFilterBanco(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value)); setCurrentPage(1); }}>
                <MenuItem value="TODOS">Todos</MenuItem>
                {sortedBanks.map((bank) => (<MenuItem key={bank.id} value={bank.id}>{bank.nome}</MenuItem>))}
              </TextField>
            </>
          }
        />

        <div className={`app-surface p-4 transition-opacity duration-200 ${isFetching && !loading ? "opacity-50" : "opacity-100"}`}>
          {loading ? (
            <>
              <div className="md:hidden"><CardSkeleton count={3} /></div>
              <div className="hidden md:block"><TableSkeleton rows={5} columns={6} /></div>
            </>
          ) : sortedAtivos.length === 0 ? (
            <EmptyState icon={Wallet} title="Nenhum ativo encontrado" description={activeFiltersCount > 0 ? "Tente ajustar seus filtros para encontrar o que procura." : "Comece cadastrando seus primeiros ativos para gerenciar sua carteira de investimentos."} actionLabel={activeFiltersCount > 0 ? "Limpar Filtros" : "Novo Ativo"} onAction={activeFiltersCount > 0 ? handleClearFilters : handleCreate} />
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {sortedAtivos.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200/80 bg-gradient-to-b from-app-surface to-neutral-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-semibold text-neutral-900">{item.nome}</p><p className="mt-1 text-xs text-neutral-700">Início: {formatDateBR(item.data_saldo_inicial)}</p><p className="mt-1 text-xs text-neutral-700">Banco: {item.banco_nome || "-"}</p></div>
                      <ActiveBadge ativo={item.ativo} />
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-neutral-700">
                      <p><span className="font-medium">Saldo inicial: </span>{formatCurrency(Number(item.saldo_inicial))}</p>
                      <p><span className="font-medium">Saldo atual: </span><span className="font-semibold text-neutral-900">{formatCurrency(Number(item.saldo_atual || 0))}</span></p>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-neutral-200 pt-3">
                      <TableActionButton action="view" title="Visualizar" onClick={() => setViewingAtivo(item)} />
                      <TableActionButton action="edit" title="Editar" onClick={() => handleEdit(item)} />
                      <TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(item)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="app-table-scroll hidden md:block">
                <table className="w-full table-fixed divide-y divide-neutral-200 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <SortableHeader label="Início Ativo" column="data_saldo_inicial" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="hidden w-[12%] xl:table-cell" />
                      <SortableHeader label="Ativo" column="nome" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[25%]" />
                      <SortableHeader label="Banco" column="banco" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[18%]" />
                      <SortableHeader label="Saldo Inicial" column="saldo_inicial" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" className="hidden w-[12%] lg:table-cell" />
                      <SortableHeader label="Saldo Atual" column="saldo_atual" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" className="w-[12%]" />
                      <SortableHeader label="Status" column="status" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="center" className="w-[10%]" />
                      <th className="app-table-head-cell-center w-[11%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-app-surface">
                    {sortedAtivos.map((item) => (
                      <tr key={item.id} className="app-table-row">
                        <td className="hidden px-3 py-2 text-xs text-neutral-700 xl:table-cell">{formatDateBR(item.data_saldo_inicial)}</td>
                        <td className="px-3 py-2 text-xs text-neutral-700"><span className="block truncate" title={item.nome}>{item.nome}</span></td>
                        <td className="px-3 py-2 text-xs text-neutral-700"><span className="block truncate" title={item.banco_nome || "-"}>{item.banco_nome || "-"}</span></td>
                        <td className="hidden px-3 py-2 text-right text-xs text-neutral-700 lg:table-cell">{formatCurrency(Number(item.saldo_inicial))}</td>
                        <td className="px-3 py-2 text-right text-xs font-semibold text-neutral-900">{formatCurrency(Number(item.saldo_atual || 0))}</td>
                        <td className="px-3 py-2 text-center text-xs"><ActiveBadge ativo={item.ativo} /></td>
                        <td className="px-3 py-2 text-center text-xs">
                          <div className="flex justify-center gap-1">
                            <TableActionButton action="view" title="Visualizar" onClick={() => setViewingAtivo(item)} compact />
                            <TableActionButton action="edit" title="Editar" onClick={() => handleEdit(item)} compact />
                            <TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(item)} compact />
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

      <InvestimentoAtivoModal isOpen={showModal} ativo={editingAtivo} banks={sortedBanks} onClose={() => { setShowModal(false); setEditingAtivo(null); }} onSave={async (message) => { toast.success(message); queryClient.invalidateQueries({ queryKey: ["ativos"] }); setShowModal(false); setEditingAtivo(null); }} />

      <ConfirmDeleteModal isOpen={!!deleteTarget} title="Confirmar exclusão" description={<>Esta ação removerá o ativo <strong>{deleteTarget?.nome}</strong>.</>} confirmLabel="Excluir ativo" onCancel={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} />

      <ViewDataModal 
        isOpen={!!viewingAtivo} 
        title="Visualizar Ativo" 
        data={viewingAtivo} 
        onClose={() => setViewingAtivo(null)} 
        fieldLabels={{ data_saldo_inicial: "Data do saldo inicial", total_aporte: "Total de aporte", total_resgate: "Total de resgate", total_rendimento: "Total de rendimentos", saldo_atual: "Saldo atual" }} 
        hideCopy={true}
      />
    </div>
  );
}
