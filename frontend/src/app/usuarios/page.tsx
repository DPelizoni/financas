"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  X,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import FeedbackAlert from "@/components/FeedbackAlert";
import Pagination from "@/components/Pagination";
import PageContainer from "@/components/PageContainer";
import { userService } from "@/services/userService";
import { User, UserRole, UserStatus } from "@/types/user";
import { authService } from "@/services/authService";
import { IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";

export default function UsuariosPage() {
  const router = useRouter();
  const filterFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
    },
  };
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | UserStatus>("");
  const [roleFilter, setRoleFilter] = useState<"" | UserRole>("");
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
        status: statusFilter || undefined,
        role: roleFilter || undefined,
      });

      setUsers(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Não foi possível carregar os usuários.";
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
          message: "Sessão inválida. Faça login novamente.",
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

  const handleUpdateRole = async (user: User, role: UserRole) => {
    if (user.role === role) return;

    try {
      setUpdatingRoleId(user.id);
      await userService.updateRole(user.id, { role });
      showFeedback("success", `Papel de ${user.nome} atualizado para ${role}.`);
      await loadUsers();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Não foi possível atualizar o papel do usuário.";
      showFeedback("error", message);
    } finally {
      setUpdatingRoleId(null);
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

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus =
      user.status === "ATIVO" ? "INATIVO" : "ATIVO";

    try {
      setUpdatingId(user.id);
      await userService.updateStatus(user.id, { status: nextStatus });
      showFeedback(
        "success",
        `Status de ${user.nome} atualizado para ${nextStatus}.`,
      );
      await loadUsers();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Não foi possível atualizar o status do usuário.";
      showFeedback("error", message);
    } finally {
      setUpdatingId(null);
    }
  };

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <ShieldCheck size={32} className="text-blue-600" />
            Gestão de Usuários
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Gerencie o status de acesso dos usuários do sistema.
          </p>
        </PageContainer>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
                sx={filterFieldSx}
                InputLabelProps={{ shrink: true }}
                value={statusFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setStatusFilter(e.target.value as "" | UserStatus);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
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
                sx={filterFieldSx}
                InputLabelProps={{ shrink: true }}
                value={roleFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setRoleFilter(e.target.value as "" | UserRole);
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="USUARIO">Usuários</MenuItem>
                <MenuItem value="GESTOR">Gestores</MenuItem>
                <MenuItem value="ADMIN">Admins</MenuItem>
              </TextField>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Carregando usuários...
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Nenhum usuário encontrado com os filtros atuais.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="border-b bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleSort("nome")}
                          className="inline-flex items-center gap-1"
                        >
                          Nome
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
                          onClick={() => handleSort("email")}
                          className="inline-flex items-center gap-1"
                        >
                          Email
                          {sortBy === "email" && sortDirection === "asc" ? (
                            <ChevronUp size={14} />
                          ) : sortBy === "email" ? (
                            <ChevronDown size={14} />
                          ) : null}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Papel
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
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {sortedUsers.map((user) => {
                      const roleValue: UserRole = user.role || "USUARIO";

                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-700">
                            {user.nome}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700">
                            {user.email}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700">
                            <select
                              value={roleValue}
                              onChange={(e) =>
                                handleUpdateRole(
                                  user,
                                  e.target.value as UserRole,
                                )
                              }
                              disabled={!isAdmin || updatingRoleId === user.id}
                              title={
                                isAdmin
                                  ? "Alterar papel do usuário"
                                  : "Somente ADMIN pode alterar papel"
                              }
                              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-90"
                            >
                              <option value="USUARIO">USUARIO</option>
                              <option value="GESTOR">GESTOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                user.status === "ATIVO"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {user.status === "ATIVO" ? (
                                <CheckCircle size={12} />
                              ) : (
                                <XCircle size={12} />
                              )}
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-sm">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              disabled={updatingId === user.id}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${
                                user.status === "ATIVO"
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-green-600 hover:bg-green-700"
                              } disabled:cursor-not-allowed disabled:opacity-70`}
                            >
                              {updatingId === user.id
                                ? "Atualizando..."
                                : user.status === "ATIVO"
                                  ? "Inativar"
                                  : "Ativar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
