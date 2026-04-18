"use client";

import { useMemo, useState } from "react";
import {
  Search,
  FileText,
  X,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Filter,
} from "lucide-react";
import Icon from "@mdi/react";
import { mdiPlusBoxOutline } from "@mdi/js";
import { descricaoService } from "@/services/descricaoService";
import { categoryService } from "@/services/categoryService";
import { Descricao, DescricaoFilters } from "@/types/descricao";
import { Category } from "@/types/category";
import DescricaoModal from "@/components/DescricaoModal";
import Pagination from "@/components/Pagination";
import { toast } from "sonner";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import { IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const [showFilters, setShowFilters] = useState(false);

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

  const { data: descricoesData, isLoading: loading, isFetching } = useQuery({
    queryKey: ["descricoes", queryFilters],
    queryFn: () => descricaoService.getAll(queryFilters),
    placeholderData: (prev) => prev,
  });

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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterCategoria !== "TODOS") count++;
    if (filterAtivo !== undefined) count++;
    return count;
  }, [searchTerm, filterCategoria, filterAtivo]);

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

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
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
                Nova Descrição
              </AppButton>
            </div>
          </div>
        </PageContainer>

        <div className={`filter-panel-surface ${!showFilters ? "hidden" : "block animate-in fade-in slide-in-from-top-2 duration-300"}`}>
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Filtros de Descrições</h3>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilterAtivo(undefined);
                setFilterCategoria("TODOS");
                setCurrentPage(1);
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition dark:text-blue-400 dark:hover:text-blue-300"
            >
              Limpar tudo
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
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
                      <IconButton size="small" onClick={() => handleSearch("")} aria-label="Limpar pesquisa">
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
          </div>
        </div>

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
                    className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50 dark:shadow-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{descricao.nome}</p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">Categoria: {getCategoryNameById(descricao.categoria_id)}</p>
                      </div>
                      {descricao.ativo ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativo</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800 dark:bg-red-900/30 dark:text-red-400">Inativo</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                      <TableActionButton action="view" title="Visualizar" onClick={() => setViewingDescricao(descricao)} />
                      <TableActionButton action="edit" title="Editar" onClick={() => handleEdit(descricao)} />
                      <TableActionButton action="delete" title="Excluir" onClick={() => setDeleteTarget(descricao)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[640px] w-full divide-y divide-gray-200 dark:divide-slate-800 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <th className="app-table-head-cell">
                        <button type="button" onClick={() => handleSort("nome")} className="inline-flex items-center gap-1">
                          Descrição
                          {sortBy === "nome" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} /> : sortBy === "nome" ? <ArrowDownWideNarrow size={14} /> : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell">
                        <button type="button" onClick={() => handleSort("categoria")} className="inline-flex items-center gap-1">
                          Categoria
                          {sortBy === "categoria" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} /> : sortBy === "categoria" ? <ArrowDownWideNarrow size={14} /> : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell">
                        <button type="button" onClick={() => handleSort("status")} className="inline-flex items-center gap-1">
                          Status
                          {sortBy === "status" && sortDirection === "asc" ? <ArrowUpNarrowWide size={14} /> : sortBy === "status" ? <ArrowDownWideNarrow size={14} /> : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {sortedDescricoes.map((descricao) => (
                      <tr key={descricao.id} className="app-table-row">
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-gray-900 dark:text-slate-200">{descricao.nome}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600 dark:text-slate-400">{getCategoryNameById(descricao.categoria_id)}</td>
                        <td className="whitespace-nowrap px-3 py-2">
                          {descricao.ativo ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativo</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-red-800 dark:bg-red-900/30 dark:text-red-400">Inativo</span>
                          )}
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
