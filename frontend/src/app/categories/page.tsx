"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tags,
  CheckCircle,
  XCircle,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { categoryService, CategoryFilters } from "@/services/categoryService";
import { Category } from "@/types/category";
import CategoryModal from "@/components/CategoryModal";
import Pagination from "@/components/Pagination";
import FeedbackAlert from "@/components/FeedbackAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

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
    "RECEITA" | "DESPESA" | undefined
  >(undefined);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
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
        tipo: filterTipo,
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

  const tipoBadge = (tipo: "RECEITA" | "DESPESA") => {
    if (tipo === "RECEITA") {
      return "bg-emerald-100 text-emerald-700";
    }
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                <Tags size={32} className="text-blue-600" />
                Gerenciamento de Categorias
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Organize categorias para classificar receitas e despesas
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Plus size={20} />
              Nova Categoria
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar categoria..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  aria-label="Limpar pesquisa"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <select
              value={filterTipo ?? ""}
              onChange={(e) => {
                setFilterTipo(
                  e.target.value
                    ? (e.target.value as "RECEITA" | "DESPESA")
                    : undefined,
                );
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>

            <div className="flex gap-2 md:col-span-4">
              <button
                onClick={() => {
                  setFilterAtivo(undefined);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-4 py-2 transition-colors ${
                  filterAtivo === undefined
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => {
                  setFilterAtivo(true);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-4 py-2 transition-colors ${
                  filterAtivo === true
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => {
                  setFilterAtivo(false);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-4 py-2 transition-colors ${
                  filterAtivo === false
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Inativos
              </button>
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
              <button
                onClick={handleCreate}
                className="mt-4 font-medium text-blue-600 hover:text-blue-700"
              >
                Criar novo registro
              </button>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <button
                        type="button"
                        onClick={() => handleSort("nome")}
                        className="inline-flex items-center gap-1"
                      >
                        Categoria
                        {sortBy === "nome" && sortDirection === "asc" ? (
                          <ChevronUp size={14} />
                        ) : sortBy === "nome" ? (
                          <ChevronDown size={14} />
                        ) : null}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <button
                        type="button"
                        onClick={() => handleSort("tipo")}
                        className="inline-flex items-center gap-1"
                      >
                        Tipo
                        {sortBy === "tipo" && sortDirection === "asc" ? (
                          <ChevronUp size={14} />
                        ) : sortBy === "tipo" ? (
                          <ChevronDown size={14} />
                        ) : null}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <button
                        type="button"
                        onClick={() => handleSort("status")}
                        className="inline-flex items-center gap-1"
                      >
                        Status
                        {sortBy === "status" && sortDirection === "asc" ? (
                          <ChevronUp size={14} />
                        ) : sortBy === "status" ? (
                          <ChevronDown size={14} />
                        ) : null}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
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
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div
                            className="mr-3 flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                            style={{ backgroundColor: category.cor }}
                          >
                            {category.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {category.nome}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoBadge(
                            category.tipo,
                          )}`}
                        >
                          {category.tipo === "RECEITA" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {category.ativo ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            <CheckCircle size={14} />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            <XCircle size={14} />
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(category)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </>
          )}
        </div>
      </div>

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
