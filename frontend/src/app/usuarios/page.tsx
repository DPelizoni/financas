"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  X,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from "lucide-react";
import Icon from "@mdi/react";
import { mdiPlusBoxOutline } from "@mdi/js";
import FeedbackAlert from "@/components/FeedbackAlert";
import Pagination from "@/components/Pagination";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";
import TableActionButton from "@/components/TableActionButton";
import ViewDataModal from "@/components/ViewDataModal";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import UserModal from "@/components/UserModal";
import { userService } from "@/services/userService";
import { User, UserRole, UserStatus } from "@/types/user";
import { authService } from "@/services/authService";
import { IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";

const roleBadgeClass: Record<UserRole, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  GESTOR: "bg-blue-100 text-blue-700",
  USUARIO: "bg-slate-100 text-slate-700",
};

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestor",
  USUARIO: "Usuario",
};

const statusLabel: Record<UserStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
};

export default function UsuariosPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "TODOS">(
    "TODOS",
  );
  const [roleFilter, setRoleFilter] = useState<UserRole | "TODOS">("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"nome" | "email" | "status">("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter === "TODOS" ? undefined : statusFilter,
        role: roleFilter === "TODOS" ? undefined : roleFilter,
      });

      setUsers(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Nao foi possivel carregar os usuarios.";
      showFeedback("error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const validateAccess = async () => {
      try {
        const me = await authService.me();
        const canManage = me.role === "GESTOR" || me.role === "ADMIN";
        setIsAdmin(me.role === "ADMIN");

        if (!canManage) {
          setAuthorized(false);
          setFeedback({
            type: "error",
            message: "Acesso permitido apenas para gestor/administrador.",
          });
          window.setTimeout(() => router.replace("/dashboard"), 800);
          return;
        }

        setAuthorized(true);
      } catch {
        setAuthorized(false);
        setFeedback({
          type: "error",
          message: "Sessao invalida. Faca login novamente.",
        });
        window.setTimeout(() => router.replace("/login"), 800);
      }
    };

    validateAccess();
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    loadUsers();
  }, [
    authorized,
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    roleFilter,
  ]);

  const handleSort = (column: "nome" | "email" | "status") => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection("asc");
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus =
      user.status === "ATIVO" ? "INATIVO" : "ATIVO";

    try {
      setUpdatingId(user.id);
      await userService.updateStatus(user.id, { status: nextStatus });
      showFeedback(
        "success",
        `Status de ${user.nome} atualizado para ${statusLabel[nextStatus]}.`,
      );
      await loadUsers();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Nao foi possivel atualizar o status do usuario.";
      showFeedback("error", message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleSaveSuccess = async (message: string) => {
    showFeedback("success", message);
    await loadUsers();
    handleCloseModal();
  };

  const handleDelete = (user: User) => {
    if (!isAdmin) {
      showFeedback("error", "Somente ADMIN pode excluir usuários.");
      return;
    }

    setDeleteTarget(user);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setUpdatingId(deleteTarget.id);
      await userService.delete(deleteTarget.id);
      showFeedback("success", `Usuário ${deleteTarget.nome} foi excluído.`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Não foi possível excluir o usuário.";
      showFeedback("error", message);
    } finally {
      setUpdatingId(null);
    }
  };

  const sortedUsers = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...users].sort((a, b) => {
      if (sortBy === "nome") {
        return a.nome.localeCompare(b.nome, "pt-BR") * direction;
      }
      if (sortBy === "email") {
        return a.email.localeCompare(b.email, "pt-BR") * direction;
      }
      return a.status.localeCompare(b.status, "pt-BR") * direction;
    });
  }, [users, sortBy, sortDirection]);

  if (authorized === null) {
    return (
      <div className="py-12 text-center text-gray-500">Validando acesso...</div>
    );
  }

  if (!authorized) {
    return (
      <div className="py-12 text-center text-gray-500">Redirecionando...</div>
    );
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                <ShieldCheck size={32} className="text-blue-600" />
                Gestão de Usuários
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gerencie o status de acesso dos usuários do sistema.
              </p>
            </div>
            <AppButton
              onClick={handleOpenCreate}
              tone="primary"
              startIcon={<Icon path={mdiPlusBoxOutline} size={0.8} />}
              className="w-full sm:w-auto"
            >
              Novo Usuario
            </AppButton>
          </div>
        </PageContainer>

        <div className="filter-panel-surface">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <TextField
                type="text"
                label="Buscar"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSearchTerm(e.target.value);
                }}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} className="text-gray-400" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCurrentPage(1);
                          setSearchTerm("");
                        }}
                        aria-label="Limpar busca"
                      >
                        <X size={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
              />
            </div>

            <div>
              <TextField
                select
                label="Status"
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={statusFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setStatusFilter(e.target.value as UserStatus | "TODOS");
                }}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="ATIVO">Ativos</MenuItem>
                <MenuItem value="INATIVO">Inativos</MenuItem>
              </TextField>
            </div>

            <div>
              <TextField
                select
                label="Papel"
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={roleFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setRoleFilter(e.target.value as UserRole | "TODOS");
                }}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="USUARIO">Usuario</MenuItem>
                <MenuItem value="GESTOR">Gestor</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </TextField>
            </div>
          </div>
        </div>

        <div className="app-surface p-4">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Carregando usuarios...
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Nenhum usuario encontrado com os filtros atuais.
            </div>
          ) : (
            <>
              <div className="space-y-2 px-2 sm:px-0 md:hidden">
                {sortedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user.nome}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">{user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        disabled={updatingId === user.id}
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none transition ${
                          user.status === "ATIVO"
                            ? "app-status-toggle-success"
                            : "app-status-toggle-error"
                        }`}
                        title="Clique para alternar o status"
                      >
                        {updatingId === user.id
                          ? "Atualizando..."
                          : statusLabel[user.status]}
                      </button>
                    </div>

                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Papel
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${roleBadgeClass[user.role]}`}
                      >
                        {roleLabel[user.role]}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                      <TableActionButton
                        action="view"
                        title="Visualizar"
                        onClick={() => setViewingUser(user)}
                      />
                      <TableActionButton
                        action="edit"
                        title="Editar"
                        onClick={() => handleOpenEdit(user)}
                      />
                      {isAdmin && (
                        <TableActionButton
                          action="delete"
                          title="Excluir usuário"
                          onClick={() => handleDelete(user)}
                          disabled={updatingId === user.id}
                        />
                      )}
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
                          Nome
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
                          onClick={() => handleSort("email")}
                          className="inline-flex items-center gap-1"
                        >
                          Email
                          {sortBy === "email" && sortDirection === "asc" ? (
                            <ArrowUpNarrowWide size={14} />
                          ) : sortBy === "email" ? (
                            <ArrowDownWideNarrow size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="app-table-head-cell">
                        Papel
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
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {sortedUsers.map((user) => (
                      <tr key={user.id} className="app-table-row">
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {user.nome}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${roleBadgeClass[user.role]}`}
                          >
                            {roleLabel[user.role]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            disabled={updatingId === user.id}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none transition ${
                              user.status === "ATIVO"
                                ? "app-status-toggle-success"
                                : "app-status-toggle-error"
                            }`}
                            title="Clique para alternar o status"
                          >
                            {updatingId === user.id
                              ? "Atualizando..."
                              : statusLabel[user.status]}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center text-xs font-medium">
                          <div className="flex justify-center gap-1">
                            <TableActionButton
                              action="view"
                              title="Visualizar"
                              onClick={() => setViewingUser(user)}
                              compact
                            />
                            <TableActionButton
                              action="edit"
                              title="Editar"
                              onClick={() => handleOpenEdit(user)}
                              compact
                            />
                            {isAdmin && (
                              <TableActionButton
                                action="delete"
                                title="Excluir usuário"
                                onClick={() => handleDelete(user)}
                                compact
                                disabled={updatingId === user.id}
                              />
                            )}
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

        {!loading && sortedUsers.length > 0 && (
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

      <UserModal
        isOpen={showUserModal}
        user={editingUser}
        isAdmin={isAdmin}
        onClose={handleCloseModal}
        onSave={handleSaveSuccess}
      />

      <ViewDataModal
        isOpen={!!viewingUser}
        title="Visualizar Usuario"
        data={viewingUser}
        onClose={() => setViewingUser(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Confirmar exclusão"
        description={
          <>
            Esta ação excluirá definitivamente o usuário{" "}
            <strong>{deleteTarget?.nome}</strong>.
          </>
        }
        confirmLabel="Excluir usuário"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

