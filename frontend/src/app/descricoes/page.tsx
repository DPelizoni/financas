"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  FileText,
  X,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
import Icon from "@mdi/react";
import { mdiPlusBoxOutline } from "@mdi/js";
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
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";

export default function DescricoesPage() {
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
  const [filterCategoria, setFilterCategoria] = useState<number | "TODOS">(
    "TODOS",
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Descricao | null>(null);
  const [viewingDescricao, setViewingDescricao] = useState<Descricao | null>(
    null,
  );
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
        categoria_id: filterCategoria === "TODOS" ? undefined : filterCategoria,
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

  const handleView = (descricao: Descricao) => {
    setViewingDescricao(descricao);
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
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                <FileText size={32} className="text-blue-600" />
                Gerenciamento de Descrições
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gerencie descrições vinculadas às categorias
              </p>
            </div>
            <AppButton
              onClick={handleCreate}
              tone="primary"
              startIcon={<Icon path={mdiPlusBoxOutline} size={0.8} />}
              className="w-full sm:w-auto"
            >
              Nova Descrição
            </AppButton>
          </div>
        </PageContainer>

        <div className="filter-panel-surface">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <TextField
                type="text"
                label="Buscar"
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
              label="Categoria"
              variant="outlined"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filterCategoria}
              onChange={(e) => {
                setFilterCategoria(
                  e.target.value === "TODOS"
                    ? "TODOS"
                    : Number(e.target.value),
                );
                setCurrentPage(1);
              }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              {sortedCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </MenuItem>
              ))}
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

        <div className="app-surface p-4">
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando dados...</p>
            </div>
          ) : descricoes.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
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
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {sortedDescricoes.map((descricao) => (
                  <div
                    key={descricao.id}
                    className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {descricao.nome}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          Categoria:{" "}
                          {getCategoryNameById(descricao.categoria_id)}
                        </p>
                      </div>

                      {descricao.ativo ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                          Inativa
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                      <TableActionButton
                        action="view"
                        title="Visualizar"
                        onClick={() => handleView(descricao)}
                      />
                      <TableActionButton
                        action="edit"
                        title="Editar"
                        onClick={() => handleEdit(descricao)}
                      />
                      <TableActionButton
                        action="delete"
                        title="Excluir"
                        onClick={() => handleDelete(descricao)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[640px] w-full divide-y divide-gray-200 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <th className="app-table-head-cell">
                        <button
                          type="button"
                          onClick={() => handleSort("nome")}
                          className="inline-flex items-center gap-1"
                        >
                          Descrição
                          {sortBy === "nome" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "nome" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell">
                        <button
                          type="button"
                          onClick={() => handleSort("categoria")}
                          className="inline-flex items-center gap-1"
                        >
                          Categoria
                          {sortBy === "categoria" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "categoria" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell">
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
                      <th className="app-table-head-cell-center">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sortedDescricoes.map((descricao) => (
                      <tr
                        key={descricao.id}
                        className="app-table-row"
                      >
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="text-xs font-medium text-gray-900">
                            {descricao.nome}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="text-xs text-gray-600">
                            {getCategoryNameById(descricao.categoria_id)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {descricao.ativo ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800">
                              Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800">
                              Inativa
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium">
                          <div className="flex justify-center gap-1">
                            <TableActionButton
                              action="view"
                              title="Visualizar"
                              onClick={() => handleView(descricao)}
                              compact
                            />
                            <TableActionButton
                              action="edit"
                              title="Editar"
                              onClick={() => handleEdit(descricao)}
                              compact
                            />
                            <TableActionButton
                              action="delete"
                              title="Excluir"
                              onClick={() => handleDelete(descricao)}
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
        data={
          viewingDescricao
            ? {
                ...viewingDescricao,
                categoria_nome: getCategoryNameById(viewingDescricao.categoria_id),
              }
            : null
        }
        onClose={() => setViewingDescricao(null)}
      />

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


