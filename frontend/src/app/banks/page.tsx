"use client";

import { useMemo, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { bankService } from "@/services/bankService";
import { Bank, BankFilters } from "@/types/bank";
import BankModal from "@/components/BankModal";
import BankLogo, { getBankLogo } from "@/components/BankLogo";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { MenuItem, TextField } from "@mui/material";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ActiveBadge from "@/components/ActiveBadge";
import SortableHeader from "@/components/SortableHeader";
import FilterBar from "@/components/FilterBar";
import { FilterChip } from "@/components/FilterChips";
import { useUrlFilterSync } from "@/utils/useUrlFilterSync";

export default function BanksPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null);
  const [viewingBank, setViewingBank] = useState<Bank | null>(null);
  const [sortBy, setSortBy] = useState<"nome" | "codigo" | "status">("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtros na URL: permite recarregar, compartilhar e voltar ao mesmo estado
  const filtersReady = useUrlFilterSync(
    (params) => {
      const busca = params.get("busca");
      if (busca) setSearchTerm(busca);
      const status = params.get("status");
      if (status === "ativos" || status === "inativos") setFilterAtivo(status === "ativos");
    },
    {
      busca: searchTerm,
      status: filterAtivo === undefined ? null : filterAtivo ? "ativos" : "inativos",
    },
  );

  // TanStack Query
  const queryFilters = useMemo(() => {
    const filters: BankFilters = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      ativo: filterAtivo,
    };
    return filters;
  }, [currentPage, itemsPerPage, searchTerm, filterAtivo]);

  const { data: banksData, isLoading, isFetching } = useQuery({
    queryKey: ["banks", queryFilters],
    queryFn: () => bankService.getAll(queryFilters),
    placeholderData: (prev) => prev,
    enabled: filtersReady,
  });
  const loading = isLoading || !filtersReady;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bankService.delete(id),
    onSuccess: () => {
      toast.success("Banco excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Não foi possível excluir o banco.");
    }
  });

  const banks = banksData?.data || [];
  const total = banksData?.pagination?.total || 0;
  const totalPages = banksData?.pagination?.totalPages || 1;

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterAtivo(undefined);
    setCurrentPage(1);
  };

  const filterChips: FilterChip[] = [];
  if (searchTerm) {
    filterChips.push({ key: "busca", label: `Busca: “${searchTerm}”`, onRemove: () => handleSearch("") });
  }
  if (filterAtivo !== undefined) {
    filterChips.push({
      key: "status",
      label: `Status: ${filterAtivo ? "Ativos" : "Inativos"}`,
      onRemove: () => {
        setFilterAtivo(undefined);
        setCurrentPage(1);
      },
    });
  }

  const handleSort = (column: "nome" | "codigo" | "status") => {
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
        return ((a.codigo || "").localeCompare(b.codigo || "", "pt-BR") * direction);
      }
      return Number(a.ativo === true) === Number(b.ativo === true) ? 0 : (a.ativo ? 1 : -1) * direction;
    });
  }, [banks, sortBy, sortDirection]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
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
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["banks"] });
    handleCloseModal();
  };

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Bancos"
          description="Gerencie suas instituições financeiras e contas"
          actions={
            <>
              <AppButton
                onClick={handleCreate}
                tone="primary"
                startIcon={<Plus size={18} />}
                className="w-full sm:w-auto"
              >
                Novo Banco
              </AppButton>
            </>
          }
        />

        <FilterBar
          label="Filtros de bancos"
          search={{ value: searchTerm, onChange: handleSearch, placeholder: "Buscar banco por nome ou código" }}
          advancedCount={filterAtivo === undefined ? 0 : 1}
          chips={filterChips}
          onClearAll={handleClearFilters}
          advanced={
            <TextField
              select
              label="Status"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterAtivo === undefined ? "TODOS" : filterAtivo.toString()}
              onChange={(e) => {
                const val = e.target.value;
                setFilterAtivo(val === "TODOS" ? undefined : val === "true");
                setCurrentPage(1);
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="true">Ativos</MenuItem>
              <MenuItem value="false">Inativos</MenuItem>
            </TextField>
          }
        />

        <div className={`app-surface p-4 transition-opacity duration-200 ${isFetching && !loading ? "opacity-50" : "opacity-100"}`}>
          {loading ? (
            <>
              <div className="md:hidden">
                <CardSkeleton count={3} />
              </div>
              <div className="hidden md:block">
                <TableSkeleton rows={5} columns={5} />
              </div>
            </>
          ) : banks.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhum banco encontrado"
              description={
                searchTerm || filterAtivo !== undefined
                  ? "Tente ajustar seus filtros para encontrar o que procura."
                  : "Comece cadastrando sua primeira instituição financeira para gerenciar seu saldo."
              }
              actionLabel={searchTerm || filterAtivo !== undefined ? "Limpar Filtros" : "Novo Banco"}
              onAction={
                searchTerm || filterAtivo !== undefined
                  ? () => {
                      setSearchTerm("");
                      setFilterAtivo(undefined);
                    }
                  : handleCreate
              }
            />
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {sortedBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="rounded-lg border border-gray-200/80 bg-gradient-to-b from-app-surface to-neutral-50 p-4 shadow-[0_1px_2_rgba(0,0,0,0.06)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50 dark:shadow-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <BankLogo nome={bank.nome} codigo={bank.codigo} />
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {bank.nome}
                          </p>
                          <p className="text-xs text-neutral-700 dark:text-slate-400">
                            Código: {bank.codigo || "-"}
                          </p>
                        </div>
                      </div>
                      <ActiveBadge ativo={bank.ativo} />
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-neutral-200 pt-3 dark:border-slate-800">
                      <TableActionButton action="view" title="Visualizar" onClick={() => setViewingBank(bank)} />
                      <TableActionButton action="edit" title="Editar" onClick={() => handleEdit(bank)} />
                      <TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(bank)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="app-table-scroll hidden md:block">
                <table className="min-w-[640px] w-full table-fixed divide-y divide-neutral-200 dark:divide-slate-800 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <SortableHeader label="Banco" column="nome" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[50%]" />
                      <SortableHeader label="Código" column="codigo" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[15%]" />
                      <SortableHeader label="Status" column="status" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="center" className="w-[20%]" />
                      <th className="app-table-head-cell-center w-[15%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-app-surface divide-y divide-neutral-200 dark:bg-slate-900 dark:divide-slate-800">
                    {sortedBanks.map((bank) => (
                      <tr key={bank.id} className="app-table-row">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <BankLogo nome={bank.nome} codigo={bank.codigo} size="sm" />
                            <div className="text-xs font-medium text-neutral-900 dark:text-slate-200">{bank.nome}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-neutral-900 dark:text-slate-300">{bank.codigo || "-"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <ActiveBadge ativo={bank.ativo} />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center text-xs font-medium">
                          <div className="flex justify-center gap-1">
                            <TableActionButton action="view" title="Visualizar" onClick={() => setViewingBank(bank)} compact />
                            <TableActionButton action="edit" title="Editar" onClick={() => handleEdit(bank)} compact />
                            <TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(bank)} compact />
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

        {!loading && banks.length > 0 && (
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
        isOpen={!!viewingBank}
        title="Visualizar Banco"
        data={viewingBank && (({ saldo_inicial, ...rest }) => rest)(viewingBank)}
        onClose={() => setViewingBank(null)}
        excludeCopyFields={["id", "codigo", "icone"]}
        fieldLabels={{ icone: "Logotipo" }}
        renderField={(key) =>
          key === "icone" && viewingBank ? (
            <div className="flex items-center gap-2">
              <BankLogo nome={viewingBank.nome} codigo={viewingBank.codigo} size="sm" />
              <span>
                {getBankLogo(viewingBank.nome, viewingBank.codigo)
                  ? "Logotipo identificado automaticamente"
                  : "Ícone padrão (banco sem logotipo cadastrado)"}
              </span>
            </div>
          ) : undefined
        }
      />

      <BankModal
        isOpen={showModal}
        bank={editingBank}
        onClose={handleCloseModal}
        onSave={handleSaveSuccess}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirmar exclusão"
        description={<>Esta ação removerá o banco <strong>{deleteTarget?.nome}</strong>.</>}
        confirmLabel="Excluir banco"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
