"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Plus,
} from "lucide-react";
import { descricaoService } from "@/services/descricaoService";
import { categoryService } from "@/services/categoryService";
import { Descricao, DescricaoFilters } from "@/types/descricao";
import { Category } from "@/types/category";
import DescricaoModal from "@/components/DescricaoModal";
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
import { parsePositiveInt, useUrlFilterSync } from "@/utils/useUrlFilterSync";

export default function DescricoesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingDescricao, setEditingDescricao] = useState<Descricao | null>(null);
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(undefined);
  const [filterCategoria, setFilterCategoria] = useState<number | "TODOS">("TODOS");
  const [deleteTarget, setDeleteTarget] = useState<Descricao | null>(null);
  const [viewingDescricao, setViewingDescricao] = useState<Descricao | null>(null);
  const [sortBy, setSortBy] = useState<"nome" | "categoria" | "status">("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  // Filtros na URL: permite recarregar, compartilhar e voltar ao mesmo estado
  const filtersReady = useUrlFilterSync(
    (params) => {
      const busca = params.get("busca");
      if (busca) setSearchTerm(busca);
      const categoria = parsePositiveInt(params.get("categoria"));
      if (categoria) setFilterCategoria(categoria);
      const status = params.get("status");
      if (status === "ativos" || status === "inativos") setFilterAtivo(status === "ativos");
    },
    {
      busca: searchTerm,
      categoria: filterCategoria === "TODOS" ? null : String(filterCategoria),
      status: filterAtivo === undefined ? null : filterAtivo ? "ativos" : "inativos",
    },
  );

  // TanStack Queries
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-reference"],
    queryFn: () => categoryService.getAll({ limit: 999 }).then(res => res.data || []),
  });

  const queryFilters = useMemo(() => {
    const filters: DescricaoFilters = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      ativo: filterAtivo,
      categoria_id: filterCategoria === "TODOS" ? undefined : filterCategoria,
    };
    return filters;
  }, [currentPage, itemsPerPage, searchTerm, filterAtivo, filterCategoria]);

  const { data: descricoesData, isLoading: loadingQuery, isFetching } = useQuery({
    queryKey: ["descricoes", queryFilters],
    enabled: filtersReady,
    queryFn: () => descricaoService.getAll(queryFilters),
    placeholderData: (prev) => prev,
  });
  const loading = loadingQuery || !filtersReady;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => descricaoService.delete(id),
    onSuccess: () => {
      toast.success("Descrição excluída com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["descricoes"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Não foi possível excluir a descrição.");
    }
  });

  const descricoes = descricoesData?.data || [];
  const total = descricoesData?.pagination?.total || 0;
  const totalPages = descricoesData?.pagination?.totalPages || 1;

  const handleSort = (column: "nome" | "categoria" | "status") => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDirection("asc");
  };

  const getCategoryNameById = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.nome : "Categoria desconhecida";
  };

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [categories],
  );

  const sortedDescricoes = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...descricoes].sort((a, b) => {
      if (sortBy === "nome") {
        return a.nome.localeCompare(b.nome, "pt-BR") * direction;
      }
      if (sortBy === "categoria") {
        return (getCategoryNameById(a.categoria_id).localeCompare(getCategoryNameById(b.categoria_id), "pt-BR") * direction);
      }
      return Number(a.ativo === true) === Number(b.ativo === true) ? 0 : (a.ativo ? 1 : -1) * direction;
    });
  }, [descricoes, sortBy, sortDirection, categories]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handleEdit = (descricao: Descricao) => {
    setEditingDescricao(descricao);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingDescricao(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDescricao(null);
  };

  const handleSaveSuccess = async (message: string): Promise<void> => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["descricoes"] });
    handleCloseModal();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterAtivo(undefined);
    setFilterCategoria("TODOS");
    setCurrentPage(1);
  };

  const filterChips: FilterChip[] = [];
  if (searchTerm) {
    filterChips.push({ key: "busca", label: `Busca: “${searchTerm}”`, onRemove: () => handleSearch("") });
  }
  if (filterCategoria !== "TODOS") {
    const nome = categories.find((cat) => cat.id === filterCategoria)?.nome ?? `#${filterCategoria}`;
    filterChips.push({ key: "categoria", label: `Categoria: ${nome}`, onRemove: () => { setFilterCategoria("TODOS"); setCurrentPage(1); } });
  }
  if (filterAtivo !== undefined) {
    filterChips.push({ key: "status", label: `Status: ${filterAtivo ? "Ativos" : "Inativos"}`, onRemove: () => { setFilterAtivo(undefined); setCurrentPage(1); } });
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Descrições"
          description="Gerencie descrições vinculadas às categorias"
          actions={
            <>
              <AppButton
                onClick={handleCreate}
                tone="primary"
                startIcon={<Plus size={18} />}
                className="w-full sm:w-auto"
              >
                Nova Descrição
              </AppButton>
            </>
          }
        />

        <FilterBar
          label="Filtros de descrições"
          search={{ value: searchTerm, onChange: handleSearch, placeholder: "Buscar descrição por nome" }}
          advancedCount={(filterCategoria !== "TODOS" ? 1 : 0) + (filterAtivo !== undefined ? 1 : 0)}
          chips={filterChips}
          onClearAll={handleClearFilters}
          advanced={
            <>
              <TextField
                select
                label="Categoria"
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filterCategoria}
                onChange={(e) => {
                  setFilterCategoria(e.target.value === "TODOS" ? "TODOS" : Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <MenuItem value="TODOS">Todas</MenuItem>
                {sortedCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nome}
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
            </>
          }
        />

        <div className={`app-surface p-4 transition-opacity duration-200 ${isFetching && !loading ? "opacity-50" : "opacity-100"}`}>
          {loading ? (
            <>
              <div className="md:hidden">
                <CardSkeleton count={3} />
              </div>
              <div className="hidden md:block">
                <TableSkeleton rows={5} columns={4} />
              </div>
            </>
          ) : descricoes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhuma descrição encontrada"
              description={
                searchTerm || filterAtivo !== undefined || filterCategoria !== "TODOS"
                  ? "Tente ajustar seus filtros para encontrar o que procura."
                  : "Comece cadastrando suas descrições de itens para facilitar seus lançamentos."
              }
              actionLabel={searchTerm || filterAtivo !== undefined || filterCategoria !== "TODOS" ? "Limpar Filtros" : "Nova Descrição"}
              onAction={
                searchTerm || filterAtivo !== undefined || filterCategoria !== "TODOS"
                  ? () => {
                      setSearchTerm("");
                      setFilterAtivo(undefined);
                      setFilterCategoria("TODOS");
                    }
                  : handleCreate
              }
            />
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {sortedDescricoes.map((descricao) => (
                  <div
                    key={descricao.id}
                    className="rounded-lg border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50 dark:shadow-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{descricao.nome}</p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Categoria: {getCategoryNameById(descricao.categoria_id)}</p>
                      </div>
                      <ActiveBadge ativo={descricao.ativo} />
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                      <TableActionButton action="view" title="Visualizar" onClick={() => setViewingDescricao(descricao)} />
                      <TableActionButton action="edit" title="Editar" onClick={() => handleEdit(descricao)} />
                      <TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(descricao)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="app-table-scroll hidden md:block">
                <table className="min-w-[640px] w-full table-fixed divide-y divide-gray-200 dark:divide-slate-800 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <SortableHeader label="Descrição" column="nome" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[45%]" />
                      <SortableHeader label="Categoria" column="categoria" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[25%]" />
                      <SortableHeader label="Status" column="status" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="center" className="w-[15%]" />
                      <th className="app-table-head-cell-center w-[15%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {sortedDescricoes.map((descricao) => (
                      <tr key={descricao.id} className="app-table-row">
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-gray-900 dark:text-slate-200"><span className="block truncate" title={descricao.nome}>{descricao.nome}</span></td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600 dark:text-slate-400"><span className="block truncate" title={getCategoryNameById(descricao.categoria_id)}>{getCategoryNameById(descricao.categoria_id)}</span></td>
                        <td className="whitespace-nowrap px-3 py-2 text-center">
                          <ActiveBadge ativo={descricao.ativo} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium">
                          <div className="flex justify-center gap-1">
                            <TableActionButton action="view" title="Visualizar" onClick={() => setViewingDescricao(descricao)} compact />
                            <TableActionButton action="edit" title="Editar" onClick={() => handleEdit(descricao)} compact />
                            <TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(descricao)} compact />
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

        {!loading && descricoes.length > 0 && (
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
        isOpen={!!viewingDescricao}
        title="Visualizar Descrição"
        data={viewingDescricao ? { ...viewingDescricao, categoria_nome: getCategoryNameById(viewingDescricao.categoria_id) } : null}
        onClose={() => setViewingDescricao(null)}
        excludeCopyFields={["id"]}
      />

      <DescricaoModal
        isOpen={showModal}
        descricao={editingDescricao}
        onClose={handleCloseModal}
        onSave={handleSaveSuccess}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirmar exclusão"
        description={<>Esta ação removerá a descrição <strong>{deleteTarget?.nome}</strong>.</>}
        confirmLabel="Excluir descrição"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
