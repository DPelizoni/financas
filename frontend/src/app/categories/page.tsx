"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Tags,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Filter,
} from "lucide-react";
import Icon from "@mdi/react";
import { mdiPlusBoxOutline } from "@mdi/js";
import { categoryService } from "@/services/categoryService";
import { Category, CategoryFilters as ICategoryFilters, CategoryType } from "@/types/category";

import CategoryModal from "@/components/CategoryModal";
import Pagination from "@/components/Pagination";
import FeedbackAlert from "@/components/FeedbackAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import { CategoryFilters } from "./components/CategoryFilters";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(
    undefined,
  );
  const [filterTipo, setFilterTipo] = useState<
    CategoryType | "TODOS"
  >("TODOS");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  
  // Estados de ordenação
  const [sortBy, setSortBy] = useState<string>("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterTipo !== "TODOS") count++;
    if (filterAtivo !== undefined) count++;
    return count;
  }, [searchTerm, filterTipo, filterAtivo]);

  const handleSort = (column: string) => {
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

  const loadCategories = async () => {
    try {
      setLoading(true);
      const filters: ICategoryFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        ativo: filterAtivo,
        tipo: filterTipo === "TODOS" ? undefined : filterTipo,
        sortBy,
        sortDirection,
      };

      const response = await categoryService.getAll(filters);
      setCategories(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      showFeedback(
        "error",
        "Não foi possível carregar as categorias. Verifique a conexão com a API.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [currentPage, searchTerm, filterAtivo, filterTipo, itemsPerPage, sortBy, sortDirection]);

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

  const handleDelete = (category: Category) => {
    setDeleteTarget(category);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await categoryService.delete(deleteTarget.id);
      showFeedback(
        "success",
        "Categoria excluída com sucesso. A ação foi concluída.",
      );
      setDeleteTarget(null);
      await loadCategories();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      const apiMessage = (error as any)?.response?.data?.message;
      showFeedback(
        "error",
        apiMessage || "Não foi possível excluir a categoria. Tente novamente.",
      );
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleView = (category: Category) => {
    setViewingCategory(category);
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
    showFeedback("success", message);
    await loadCategories();
    handleCloseModal();
  };

  const viewingCategoryData = viewingCategory
    ? viewingCategory
    : null;

  const tipoBadge = (tipo: CategoryType) => {
    if (tipo === "RECEITA") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  };

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                <Tags size={32} className="text-blue-600 dark:text-blue-400" />
                Gerenciamento de Categorias
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                Organize categorias para classificar receitas e despesas
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <AppButton
                tone={showFilters ? "outline-primary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
                startIcon={<Filter size={18} className={showFilters ? "fill-blue-100 dark:fill-blue-900/50" : ""} />}
              >
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                    {activeFiltersCount}
                  </span>
                )}
              </AppButton>
              <AppButton
                onClick={handleCreate}
                tone="primary"
                startIcon={<Icon path={mdiPlusBoxOutline} size={0.8} />}
                className="w-full sm:w-auto"
              >
                Nova Categoria
              </AppButton>
            </div>
          </div>
        </PageContainer>

        <CategoryFilters
          showFilters={showFilters}
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

        <div className="app-surface p-4">
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
              {/* Visão Mobile - Cards */}
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white shadow-sm"
                          style={{ backgroundColor: category.cor }}
                        >
                          {category.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {category.nome}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${tipoBadge(
                              category.tipo,
                            )}`}
                          >
                            {category.tipo === "RECEITA"
                              ? "Receita"
                              : "Despesa"}
                          </span>
                        </div>
                      </div>

                      {category.ativo ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                      <TableActionButton
                        action="view"
                        title="Visualizar"
                        onClick={() => handleView(category)}
                      />
                      <TableActionButton
                        action="edit"
                        title="Editar"
                        onClick={() => handleEdit(category)}
                      />
                      <TableActionButton
                        action="delete"
                        title="Excluir"
                        onClick={() => handleDelete(category)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Visão Desktop - Tabela */}
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[640px] w-full table-fixed divide-y divide-gray-200 text-xs dark:divide-slate-800">
                  <thead className="app-table-head">
                    <tr>
                      <th className="app-table-head-cell w-[55%]">
                        <button
                          type="button"
                          onClick={() => handleSort("nome")}
                          className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Categoria
                          {sortBy === "nome" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} className="text-blue-600" />
                          ) : sortBy === "nome" ? (
                            <ArrowDownWideNarrow size={14} className="text-blue-600" />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell w-[15%]">
                        <button
                          type="button"
                          onClick={() => handleSort("tipo")}
                          className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Tipo
                          {sortBy === "tipo" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} className="text-blue-600" />
                          ) : sortBy === "tipo" ? (
                            <ArrowDownWideNarrow size={14} className="text-blue-600" />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell w-[15%]">
                        <button
                          type="button"
                          onClick={() => handleSort("ativo")}
                          className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          Status
                          {sortBy === "ativo" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} className="text-blue-600" />
                          ) : sortBy === "ativo" ? (
                            <ArrowDownWideNarrow size={14} className="text-blue-600" />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell-center w-[15%]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="app-table-row"
                      >
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="flex items-center">
                            <div
                              className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: category.cor }}
                            >
                              {category.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="text-xs font-medium text-gray-900 dark:text-slate-200">
                              {category.nome}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${tipoBadge(
                              category.tipo,
                            )}`}
                          >
                            {category.tipo === "RECEITA"
                              ? "Receita"
                              : "Despesa"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {category.ativo ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium">
                          <div className="flex justify-center gap-1">
                            <TableActionButton
                              action="view"
                              title="Visualizar"
                              onClick={() => handleView(category)}
                              compact
                            />
                            <TableActionButton
                              action="edit"
                              title="Editar"
                              onClick={() => handleEdit(category)}
                              compact
                            />
                            <TableActionButton
                              action="delete"
                              title="Excluir"
                              onClick={() => handleDelete(category)}
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
        data={viewingCategoryData}
        onClose={() => setViewingCategory(null)}
      />

      {/* Modal */}
      <CategoryModal
        isOpen={showModal}
        category={editingCategory}
        onClose={handleCloseModal}
        onSave={handleSaveSuccess}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirmar exclusão"
        description={
          <>
            Esta ação removerá a categoria <strong>{deleteTarget?.nome}</strong>
            .
          </>
        }
        confirmLabel="Excluir categoria"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
