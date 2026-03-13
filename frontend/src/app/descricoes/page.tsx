"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  descricaoService,
  DescricaoFilters,
} from "@/services/descricaoService";
import { categoryService } from "@/services/categoryService";
import { Descricao } from "@/types/descricao";
import { Category } from "@/types/category";
import DescricaoModal from "@/components/DescricaoModal";
import Pagination from "@/components/Pagination";
import FeedbackAlert from "@/components/FeedbackAlert";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageContainer from "@/components/PageContainer";
import { IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";

export default function DescricoesPage() {
  const filterFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
    },
  };
  const [descricoes, setDescricoes] = useState<Descricao[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingDescricao, setEditingDescricao] = useState<Descricao | null>(
    null,
  );
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(
    undefined,
  );
  const [filterCategoria, setFilterCategoria] = useState<number | undefined>(
    undefined,
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Descricao | null>(null);
  const [sortBy, setSortBy] = useState<"nome" | "categoria" | "status">("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
        return (
          getCategoryNameById(a.categoria_id).localeCompare(
            getCategoryNameById(b.categoria_id),
            "pt-BR",
          ) * direction
        );
      }
      return Number(a.ativo === true) === Number(b.ativo === true)
        ? 0
        : (a.ativo ? 1 : -1) * direction;
    });
  }, [descricoes, sortBy, sortDirection, categories]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const loadDescricoes = async () => {
    try {
      setLoading(true);
      const filters: DescricaoFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        ativo: filterAtivo,
        categoria_id: filterCategoria,
      };

      const response = await descricaoService.getAll(filters);
      setDescricoes(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Erro ao carregar descrições:", error);
      showFeedback(
        "error",
        "Não foi possível carregar as descrições. Verifique a conexão com a API.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll({ limit: 100 });
      setCategories(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadDescricoes();
  }, [currentPage, searchTerm, filterAtivo, filterCategoria, itemsPerPage]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDelete = (descricao: Descricao) => {
    setDeleteTarget(descricao);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await descricaoService.delete(deleteTarget.id);
      showFeedback(
        "success",
        "Descrição excluída com sucesso. A ação foi concluída.",
      );
      setDeleteTarget(null);
      await loadDescricoes();
    } catch (error) {
      console.error("Erro ao excluir descrição:", error);
      const apiMessage = (error as any)?.response?.data?.message;
      showFeedback(
        "error",
        apiMessage || "Não foi possível excluir a descrição. Tente novamente.",
      );
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
    showFeedback("success", message);
    await loadDescricoes();
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                <FileText size={32} className="text-blue-600" />
                Gerenciamento de Descrições
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gerencie descrições vinculadas às categorias
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Plus size={20} />
              Nova Descrição
            </button>
          </div>
        </PageContainer>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <TextField
                type="text"
                label="Buscar"
                placeholder="Digitar..."
                variant="outlined"
                size="small"
                fullWidth
                sx={filterFieldSx}
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
              label="Categoria"
              variant="outlined"
              size="small"
              fullWidth
              sx={filterFieldSx}
              InputLabelProps={{ shrink: true }}
              value={filterCategoria ?? ""}
              onChange={(e) => {
                setFilterCategoria(
                  e.target.value ? Number(e.target.value) : undefined,
                );
                setCurrentPage(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {sortedCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </MenuItem>
              ))}
            </TextField>

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
          ) : descricoes.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
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
                <thead className="border-b bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      <button
                        type="button"
                        onClick={() => handleSort("nome")}
                        className="inline-flex items-center gap-1"
                      >
                        Descrição
                        {sortBy === "nome" && sortDirection === "asc" ? (
                          <ChevronUp size={14} />
                        ) : sortBy === "nome" ? (
                          <ChevronDown size={14} />
                        ) : null}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      <button
                        type="button"
                        onClick={() => handleSort("categoria")}
                        className="inline-flex items-center gap-1"
                      >
                        Categoria
                        {sortBy === "categoria" && sortDirection === "asc" ? (
                          <ChevronUp size={14} />
                        ) : sortBy === "categoria" ? (
                          <ChevronDown size={14} />
                        ) : null}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
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
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedDescricoes.map((descricao) => (
                    <tr
                      key={descricao.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {descricao.nome}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {getCategoryNameById(descricao.categoria_id)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {descricao.ativo ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            <CheckCircle size={14} />
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            <XCircle size={14} />
                            Inativa
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(descricao)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(descricao)}
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
                itemsPerPageOptions={[5, 10, 20, 50, 100]}
                centeredLayout
              />
            </>
          )}
        </div>
      </div>

      {showModal && (
        <DescricaoModal
          descricao={editingDescricao}
          onClose={handleCloseModal}
          onSave={handleSaveSuccess}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirmar exclusão"
        description={
          <>
            Esta ação removerá a descrição <strong>{deleteTarget?.nome}</strong>
            .
          </>
        }
        confirmLabel="Excluir descrição"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
