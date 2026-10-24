"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Plus,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import PageHeader from "@/components/PageHeader";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import UserModal from "@/components/UserModal";
import { userService } from "@/services/userService";
import { User, UserRole, UserStatus } from "@/types/user";
import { authService } from "@/services/authService";
import { MenuItem, TextField } from "@mui/material";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons/DataSkeletons";
import EmptyState from "@/components/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SortableHeader from "@/components/SortableHeader";
import FilterBar from "@/components/FilterBar";
import { FilterChip } from "@/components/FilterChips";
import { useUrlFilterSync } from "@/utils/useUrlFilterSync";

const roleBadgeClass: Record<UserRole, string> = {
  ADMIN: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  GESTOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  USUARIO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestor",
  USUARIO: "Usuário",
};

const statusLabel: Record<UserStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
};

export default function UsuariosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "TODOS">("TODOS");
  const [roleFilter, setRoleFilter] = useState<UserRole | "TODOS">("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"nome" | "email" | "status">("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  // Filtros na URL: permite recarregar, compartilhar e voltar ao mesmo estado
  const filtersReady = useUrlFilterSync(
    (params) => {
      const busca = params.get("busca");
      if (busca) setSearchTerm(busca);
      const status = params.get("status");
      if (status === "ATIVO" || status === "INATIVO") setStatusFilter(status);
      const papel = params.get("papel");
      if (papel === "USUARIO" || papel === "GESTOR" || papel === "ADMIN") setRoleFilter(papel);
    },
    {
      busca: searchTerm,
      status: statusFilter === "TODOS" ? null : statusFilter,
      papel: roleFilter === "TODOS" ? null : roleFilter,
    },
  );

  // Auth Query
  const { data: me, isLoading: loadingAuth, isError: authError } = useQuery({
    queryKey: ["me"],
    queryFn: () => authService.me(),
    retry: false,
  });

  const authorized = useMemo(() => {
    if (loadingAuth) return null;
    if (authError || !me) return false;
    const canManage = me.role === "GESTOR" || me.role === "ADMIN";
    return canManage;
  }, [me, loadingAuth, authError]);

  useEffect(() => {
    if (me) setIsAdmin(me.role === "ADMIN");
    if (authorized === false) {
      toast.error("Acesso negado.");
      router.replace("/dashboard");
    }
  }, [authorized, me, router]);

  // Users Query
  const queryFilters = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm || undefined,
    status: statusFilter === "TODOS" ? undefined : statusFilter,
    role: roleFilter === "TODOS" ? undefined : roleFilter,
  }), [currentPage, itemsPerPage, searchTerm, statusFilter, roleFilter]);

  const { data: usersData, isLoading: loadingQuery, isFetching } = useQuery({
    queryKey: ["users", queryFilters],
    queryFn: () => userService.getAll(queryFilters),
    enabled: !!authorized && filtersReady,
    placeholderData: (prev) => prev,
  });
  const loading = loadingQuery || !filtersReady;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Não foi possível excluir o usuário.");
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: UserStatus }) => userService.updateStatus(id, { status }),
    onSuccess: (_, variables) => {
      toast.success("Status atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUpdatingId(null);
    },
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message;
      toast.error(apiMessage || "Erro ao atualizar status.");
      setUpdatingId(null);
    }
  });

  const users = usersData?.data || [];
  const total = usersData?.pagination?.total || 0;
  const totalPages = usersData?.pagination?.totalPages || 1;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== "TODOS") count++;
    if (roleFilter !== "TODOS") count++;
    return count;
  }, [searchTerm, statusFilter, roleFilter]);

  const handleSort = (column: "nome" | "email" | "status") => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortDirection("asc");
  };

  const handleToggleStatus = (user: User) => {
    const nextStatus: UserStatus = user.status === "ATIVO" ? "INATIVO" : "ATIVO";
    setUpdatingId(user.id);
    toggleStatusMutation.mutate({ id: user.id, status: nextStatus });
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  };

  const sortedUsers = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...users].sort((a, b) => {
      if (sortBy === "nome") return a.nome.localeCompare(b.nome, "pt-BR") * direction;
      if (sortBy === "email") return a.email.localeCompare(b.email, "pt-BR") * direction;
      return a.status.localeCompare(b.status, "pt-BR") * direction;
    });
  }, [users, sortBy, sortDirection]);

  if (authorized === null) return <div className="py-12 text-center text-gray-500">Validando acesso...</div>;
  if (!authorized) return <div className="py-12 text-center text-gray-500">Redirecionando...</div>;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("TODOS");
    setRoleFilter("TODOS");
    setCurrentPage(1);
  };

  const filterChips: FilterChip[] = [];
  if (searchTerm) {
    filterChips.push({ key: "busca", label: `Busca: “${searchTerm}”`, onRemove: () => handleSearchChange("") });
  }
  if (statusFilter !== "TODOS") {
    filterChips.push({ key: "status", label: `Status: ${statusLabel[statusFilter]}`, onRemove: () => { setStatusFilter("TODOS"); setCurrentPage(1); } });
  }
  if (roleFilter !== "TODOS") {
    filterChips.push({ key: "papel", label: `Papel: ${roleLabel[roleFilter]}`, onRemove: () => { setRoleFilter("TODOS"); setCurrentPage(1); } });
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Usuários"
          description="Gerencie o status de acesso dos usuários do sistema."
          actions={
            <>
              <AppButton onClick={() => { setEditingUser(null); setShowUserModal(true); }} tone="primary" startIcon={<Plus size={18} />} className="w-full sm:w-auto">Novo Usuário</AppButton>
            </>
          }
        />

        <FilterBar
          label="Filtros de usuários"
          search={{ value: searchTerm, onChange: handleSearchChange, placeholder: "Buscar usuário por nome ou e-mail" }}
          advancedCount={(statusFilter !== "TODOS" ? 1 : 0) + (roleFilter !== "TODOS" ? 1 : 0)}
          chips={filterChips}
          onClearAll={handleClearFilters}
          advanced={
            <>
              <TextField select label="Status" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={statusFilter} onChange={(e) => { setCurrentPage(1); setStatusFilter(e.target.value as UserStatus | "TODOS"); }}>
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="ATIVO">Ativos</MenuItem>
                <MenuItem value="INATIVO">Inativos</MenuItem>
              </TextField>

              <TextField select label="Papel" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={roleFilter} onChange={(e) => { setCurrentPage(1); setRoleFilter(e.target.value as UserRole | "TODOS"); }}>
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="USUARIO">Usuário</MenuItem>
                <MenuItem value="GESTOR">Gestor</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </TextField>
            </>
          }
        />

        <div className={`app-surface p-4 transition-opacity duration-200 ${isFetching && !loading ? "opacity-50" : "opacity-100"}`}>
          {loading ? (
            <>
              <div className="md:hidden"><CardSkeleton count={3} /></div>
              <div className="hidden md:block"><TableSkeleton rows={5} columns={5} /></div>
            </>
          ) : users.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="Nenhum usuário encontrado" description={activeFiltersCount > 0 ? "Tente ajustar seus filtros para encontrar o que procura." : "Nenhum usuário cadastrado no sistema além de você."} actionLabel={activeFiltersCount > 0 ? "Limpar Filtros" : "Novo Usuário"} onAction={activeFiltersCount > 0 ? () => { setSearchTerm(""); setStatusFilter("TODOS"); setRoleFilter("TODOS"); setCurrentPage(1); } : () => { setEditingUser(null); setShowUserModal(true); }} />
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {sortedUsers.map((user) => (
                  <div key={user.id} className="rounded-lg border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50 dark:shadow-none">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-semibold text-gray-900 dark:text-white">{user.nome}</p><p className="mt-1 text-xs text-gray-600 dark:text-slate-400">{user.email}</p></div>
                      <button type="button" onClick={() => handleToggleStatus(user)} disabled={updatingId === user.id} className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none transition ${user.status === "ATIVO" ? "app-status-toggle-success" : "app-status-toggle-error"}`} title="Clique para alternar o status">{updatingId === user.id ? "Atualizando..." : statusLabel[user.status]}</button>
                    </div>
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">Papel</p>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${roleBadgeClass[user.role]}`}>{roleLabel[user.role]}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                      <TableActionButton action="view" title="Visualizar" onClick={() => setViewingUser(user)} />
                      <TableActionButton action="edit" title="Editar" onClick={() => { setEditingUser(user); setShowUserModal(true); }} />
                      {isAdmin && <TableActionButton action="delete" title="Excluir usuário" onClick={() => setDeleteTarget(user)} disabled={updatingId === user.id} />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="app-table-scroll hidden md:block">
                <table className="min-w-[640px] w-full table-fixed divide-y divide-gray-200 dark:divide-slate-800 text-xs">
                  <thead className="app-table-head">
                    <tr>
                      <SortableHeader label="Nome" column="nome" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[25%]" />
                      <SortableHeader label="Email" column="email" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} className="w-[30%]" />
                      <th className="app-table-head-cell-center w-[15%]">Papel</th>
                      <SortableHeader label="Status" column="status" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} align="center" className="w-[15%]" />
                      <th className="app-table-head-cell-center w-[15%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {sortedUsers.map((user) => (
                      <tr key={user.id} className="app-table-row">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700 dark:text-slate-300"><span className="block truncate" title={user.nome}>{user.nome}</span></td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700 dark:text-slate-300"><span className="block truncate" title={user.email}>{user.email}</span></td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-center"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${roleBadgeClass[user.role]}`}>{roleLabel[user.role]}</span></td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-center"><button type="button" onClick={() => handleToggleStatus(user)} disabled={updatingId === user.id} className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none transition ${user.status === "ATIVO" ? "app-status-toggle-success" : "app-status-toggle-error"}`} title="Clique para alternar o status">{updatingId === user.id ? "Atualizando..." : statusLabel[user.status]}</button></td>
                        <td className="whitespace-nowrap px-3 py-2 text-center text-xs font-medium"><div className="flex justify-center gap-1"><TableActionButton action="view" title="Visualizar" onClick={() => setViewingUser(user)} compact /><TableActionButton action="edit" title="Editar" onClick={() => { setEditingUser(user); setShowUserModal(true); }} compact />{isAdmin && <TableActionButton action="delete" title="Excluir usuário" onClick={() => setDeleteTarget(user)} compact disabled={updatingId === user.id} />}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {!loading && users.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} total={total} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} itemsPerPageOptions={[5, 10, 20, 50, 100]} centeredLayout />}
      </div>

      <UserModal isOpen={showUserModal} user={editingUser} isAdmin={isAdmin} onClose={() => { setShowUserModal(false); setEditingUser(null); }} onSave={async (message) => { toast.success(message); queryClient.invalidateQueries({ queryKey: ["users"] }); setShowUserModal(false); setEditingUser(null); }} />

      <ViewDataModal 
        isOpen={!!viewingUser} 
        title="Visualizar Usuário" 
        data={viewingUser} 
        onClose={() => setViewingUser(null)} 
        hideCopy={true}
      />

      <ConfirmDeleteModal isOpen={!!deleteTarget} title="Confirmar exclusão" description={<>Esta ação excluirá definitivamente o usuário <strong>{deleteTarget?.nome}</strong>.</>} confirmLabel="Excluir usuário" onCancel={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} />
    </div>
  );
}
