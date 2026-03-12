export type UserStatus = "ATIVO" | "INATIVO";
export type UserRole = "USUARIO" | "GESTOR" | "ADMIN";

export interface User {
  id: number;
  nome: string;
  email: string;
  senha: string;
  status: UserStatus;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: number;
  nome: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  nome: string;
  email: string;
  senha: string;
  status?: UserStatus;
  role?: UserRole;
}

export interface UserFilters {
  search?: string;
  status?: UserStatus;
  role?: UserRole;
  page?: number;
  limit?: number;
}

export interface UserStatusUpdateInput {
  status: UserStatus;
}

export interface UserRoleUpdateInput {
  role: UserRole;
}

export interface UserLoginInput {
  email: string;
  senha: string;
}

export interface AuthTokenPayload {
  sub: number;
  nome: string;
  email: string;
  status: UserStatus;
  role: UserRole;
}

export interface AuthResult {
  token: string;
  usuario: UserPublic;
}
