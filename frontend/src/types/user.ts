export type UserStatus = "ATIVO" | "INATIVO";
export type UserRole = "USUARIO" | "GESTOR" | "ADMIN";

export interface User {
  id: number;
  nome: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserStatusUpdateInput {
  status: UserStatus;
}

export interface UserRoleUpdateInput {
  role: UserRole;
}

export interface UserCreateInput {
  nome: string;
  email: string;
  senha: string;
  status: UserStatus;
  role: UserRole;
}

export interface UserUpdateInput {
  nome: string;
  email: string;
  senha?: string;
  status: UserStatus;
  role: UserRole;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
