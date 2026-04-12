import { BaseFilters } from "./api";

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

export interface UserFilters extends BaseFilters {
  status?: UserStatus;
  role?: UserRole;
}
