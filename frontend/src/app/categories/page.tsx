"use client";

import { useMemo, useState } from "react";
import {
  Tags,
  Plus,
} from "lucide-react";
import { categoryService } from "@/services/categoryService";
import { Category, CategoryFilters as ICategoryFilters, CategoryType } from "@/types/category";

import CategoryModal from "@/components/CategoryModal";
import CategoryIcon from "@/components/CategoryIcon";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import { CategoryFilters } from "./components/CategoryFilters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ActiveBadge from "@/components/ActiveBadge";
import SortableHeader from "@/components/SortableHeader";
import { useUrlFilterSync } from "@/utils/useUrlFilterSync";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(undefined);
  const [filterTipo, setFilterTipo] = useState<CategoryType | "TODOS">("TODOS");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [sortBy, setSortBy] = useState<string>("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtros na URL: permite recarregar, compartilhar e voltar ao mesmo estado
  const filtersReady = useUrlFilterSync(
    (params) => {
      const busca = params.get("busca");
      if (busca) setSearchTerm(busca);
      const tipo = params.get("tipo");
      if (tipo === "DESPESA" || tipo === "RECEITA") setFilterTipo(tipo);
      const status = params.get("status");
      if (status === "ativos" || status === "inativos") setFilterAtivo(status === "ativos");
    },
    {
      busca: searchTerm,
      tipo: filterTipo === "TODOS" ? null : filterTipo,
      status: filterAtivo === undefined ? null : filterAtivo ? "ativos" : "inativos",
    },
  );

  // TanStack Query
  const queryFilters = useMemo(() => {
    const filters: ICategoryFilters = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      ativo: filterAtivo,
      tipo: filterTipo === "TODOS" ? undefined : filterTipo,
      sortBy,
      sortDirection,
    };
    return filters;
  }, [currentPage, itemsPerPage, searchTerm, filterAtivo, filterTipo, sortBy, sortDirection]);

  const { data: categoriesData, isLoading, isFetching } = useQuery({
    queryKey: ["categories", queryFilters],
    queryFn: () => categoryService.getAll(queryFilters),
    placeholderData: (prev) => prev,
    enabled: filtersReady,
  });
  const loading = isLoading || !filtersReady;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: () => {
      toast.success("Categoria excluída com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Não foi possível excluir a categoria.");
    }
  });

  const categories = categoriesData?.data || [];
  const total = categoriesData?.pagination?.total || 0;
  const totalPages = categoriesData?.pagination?.totalPages || 1;

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDirection("asc");
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterAtivo(undefined);
    setFilterTipo("TODOS");
    setCurrentPage(1);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSaveSuccess = async (message: string): Promise<void> => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    handleCloseModal();
  };

  const tipoBadge = (tipo: CategoryType) => {
    if (tipo === "RECEITA") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  };

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Categorias"
          description="Organize categorias para classificar receitas e despesas"
          actions={
            <>
              <AppButton
                onClick={handleCreate}
                tone="primary"
                startIcon={<Plus size={18} />}
                className="w-full sm:w-auto"
              >
                Nova Categoria
              </AppButton>
            </>
          }
        />

        <CategoryFilters
          searchTerm={searchTerm}
          filterTipo={filterTipo}
          filterAtivo={filterAtivo}
          onSearch={handleSearch}
          onFilterTipoChange={(val) => {
            setFilterTipo(val);
            setCurrentPage(1);
          }}
          onFilterAtivoChange={(val) => {
            setFilterAtivo(val);
            setCurrentPage(1);
          }}
          onClearFilters={handleClearFilters}
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
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="Nenhuma categoria encontrada"
              description={
                searchTerm || filterAtivo !== undefined || filterTipo !== "TODOS"
                  ? "Tente ajustar seus filtros para encontrar o que procura."
                  : "Comece cadastrando suas categorias para classificar suas receitas e despesas."
              }
              actionLabel={searchTerm || filterAtivo !== undefined || filterTipo !== "TODOS" ? "Limpar Filtros" : "Nova Categoria"}
              onAction={
                searchTerm || filterAtivo !== undefined || filterTipo !== "TODOS"
                  ? handleClearFilters
                  : handleCreate
              }
            />
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-lg border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CategoryIcon nome={category.nome} tipo={category.tipo} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {category.nome}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${tipoBadge(
                              category.tipo,
                            )}`}
                          >
                            {category.tipo === "RECEITA"
                              ? "Receita"
                              : "Despesa"}
                          </span>
                        </div>
                      </div>

                      <ActiveBadge ativo={category.ativo} />
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                      <TableActionButton action="view" title="Visualizar" onClick={() => setViewingCategory(category)} />
                      <TableActionButton action="edit" title="Editar" onClick={() => handleEdit(category)} />
                      <TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(category)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="app-table-scroll hidden md:block">
                <table className="min-w-[640px] w-full table-fixed divide-y divide-gray-200 text-xs dark:divide-slate-800">
                  <thead className="app-table-head">
                    <tr>
                      <SortableHeader label="Categoria" column="nome" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[55%]" />
                      <SortableHeader label="Tipo" column="tipo" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="center" className="w-[15%]" />
                      <SortableHeader label="Status" column="ativo" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="center" className="w-[15%]" />
                      <th className="app-table-head-cell-center w-[15%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                    {categories.map((category) => (
                      <tr key={category.id} className="app-table-row">
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="flex items-center gap-2">
                            <CategoryIcon nome={category.nome} tipo={category.tipo} size="sm" />
                            <div className="text-xs font-medium text-gray-900 dark:text-slate-200">{category.nome}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${tipoBadge(category.tipo)}`}>
                            {category.tipo === "RECEITA" ? "Receita" : "Despesa"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-center">
                          <ActiveBadge ativo={category.ativo} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium">
                          <div className="flex justify-center gap-1">
                            <TableActionButton action="view" title="Visualizar" onClick={() => setViewingCategory(category)} compact />
                            <TableActionButton action="edit" title="Editar" onClick={() => handleEdit(category)} compact />
                            <TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(category)} compact />
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

        {!loading && categories.length > 0 && (
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
        isOpen={!!viewingCategory}
        title="Visualizar Categoria"
        data={viewingCategory}
        onClose={() => setViewingCategory(null)}
        excludeCopyFields={["id"]}
      />

      <CategoryModal
        isOpen={showModal}
        category={editingCategory}
        onClose={handleCloseModal}
        onSave={handleSaveSuccess}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirmar exclusão"
        description={<>Esta ação removerá a categoria <strong>{deleteTarget?.nome}</strong>.</>}
        confirmLabel="Excluir categoria"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
