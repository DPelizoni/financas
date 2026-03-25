"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Tags,
  X,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
import { categoryService, CategoryFilters } from "@/services/categoryService";
import { Category } from "@/types/category";
import CategoryModal from "@/components/CategoryModal";
import Pagination from "@/components/Pagination";
import FeedbackAlert from "@/components/FeedbackAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";

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
    "RECEITA" | "DESPESA" | "TODOS"
  >("TODOS");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [sortBy, setSortBy] = useState<"nome" | "tipo" | "status">("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: "nome" | "tipo" | "status") => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDirection("asc");
  };

  const sortedCategories = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...categories].sort((a, b) => {
      if (sortBy === "nome") {
        return a.nome.localeCompare(b.nome, "pt-BR") * direction;
      }
      if (sortBy === "tipo") {
        return a.tipo.localeCompare(b.tipo, "pt-BR") * direction;
      }
      return Number(a.ativo === true) === Number(b.ativo === true)
        ? 0
        : (a.ativo ? 1 : -1) * direction;
    });
  }, [categories, sortBy, sortDirection]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const filters: CategoryFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        ativo: filterAtivo,
        tipo: filterTipo === "TODOS" ? undefined : filterTipo,
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
  }, [currentPage, searchTerm, filterAtivo, filterTipo, itemsPerPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
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
    ? (() => {
        const { cor, ...baseData } = viewingCategory;
        return baseData;
      })()
    : null;

  const tipoBadge = (tipo: "RECEITA" | "DESPESA") => {
    if (tipo === "RECEITA") {
      return "bg-emerald-100 text-emerald-700";
    }
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                <Tags size={32} className="text-blue-600" />
                Gerenciamento de Categorias
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Organize categorias para classificar receitas e despesas
              </p>
            </div>
            <AppButton
              onClick={handleCreate}
              tone="primary"
              startIcon={<Plus size={18} />}
              className="w-full sm:w-auto"
            >
              Nova Categoria
            </AppButton>
          </div>
        </PageContainer>

        <div className="filter-panel-surface">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <TextField
                type="text"
                label="Buscar"
                placeholder="Digitar..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} className="text-gray-400" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleSearch("")}
                        aria-label="Limpar pesquisa"
                      >
                        <X size={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
              />
            </div>

            <TextField
              select
              label="Tipo"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterTipo}
              onChange={(e) => {
                setFilterTipo(
                  e.target.value as "RECEITA" | "DESPESA" | "TODOS",
                );
                setCurrentPage(1);
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="DESPESA">Despesa</MenuItem>
              <MenuItem value="RECEITA">Receita</MenuItem>
            </TextField>

            <div className="flex flex-wrap gap-2 md:col-span-4">
              <AppButton
                onClick={() => {
                  setFilterAtivo(undefined);
                  setCurrentPage(1);
                }}
                tone={filterAtivo === undefined ? "primary" : "outline-primary"}
                size="sm"
              >
                Todos
              </AppButton>
              <AppButton
                onClick={() => {
                  setFilterAtivo(true);
                  setCurrentPage(1);
                }}
                tone={filterAtivo === true ? "success" : "outline-success"}
                size="sm"
              >
                Ativos
              </AppButton>
              <AppButton
                onClick={() => {
                  setFilterAtivo(false);
                  setCurrentPage(1);
                }}
                tone={filterAtivo === false ? "danger" : "outline-danger"}
                size="sm"
              >
                Inativos
              </AppButton>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando dados...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <Tags size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhum registro encontrado</p>
              <AppButton
                onClick={handleCreate}
                tone="ghost"
                size="sm"
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Criar novo registro
              </AppButton>
            </div>
          ) : (
            <>
              <div className="space-y-2 p-2 sm:p-3 md:hidden">
                {sortedCategories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                          style={{ backgroundColor: category.cor }}
                        >
                          {category.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
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
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
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

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[640px] w-full divide-y divide-gray-200 text-xs">
                  <thead className="border-b bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleSort("nome")}
                          className="inline-flex items-center gap-1"
                        >
                          Categoria
                          {sortBy === "nome" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "nome" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleSort("tipo")}
                          className="inline-flex items-center gap-1"
                        >
                          Tipo
                          {sortBy === "tipo" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "tipo" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
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
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sortedCategories.map((category) => (
                      <tr
                        key={category.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="flex items-center">
                            <div
                              className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{ backgroundColor: category.cor }}
                            >
                              {category.nome.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="text-xs font-medium text-gray-900">
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
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium">
                          <div className="flex justify-end gap-1">
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
            </>
          )}
        </div>
      </div>

      <ViewDataModal
        isOpen={!!viewingCategory}
        title="Visualizar Categoria"
        data={viewingCategoryData}
        onClose={() => setViewingCategory(null)}
      />

      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={handleCloseModal}
          onSave={handleSaveSuccess}
        />
      )}

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


