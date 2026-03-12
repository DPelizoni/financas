export type UserStatus = "ATIVO" | "INATIVO";
export type UserRole = "USUARIO" | "GESTOR" | "ADMIN";

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface LoginInput {
  email: string;
  senha: string;
}

export interface RegisterInput {
  nome: string;
  email: string;
  senha: string;
}

export interface AuthSession {
  token: string;
  usuario: AuthUser;
}
