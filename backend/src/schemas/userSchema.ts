import { z } from "zod";

export const userFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
  role: z.enum(["USUARIO", "GESTOR", "ADMIN"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const userStatusUpdateSchema = z.object({
  status: z.enum(["ATIVO", "INATIVO"]),
});

export const userRoleUpdateSchema = z.object({
  role: z.enum(["USUARIO", "GESTOR", "ADMIN"]),
});

export const userCreateManagementSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),
  email: z.string().trim().email("Email inválido"),
  senha: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(128, "Senha deve ter no máximo 128 caracteres"),
  status: z.enum(["ATIVO", "INATIVO"]),
  role: z.enum(["USUARIO", "GESTOR", "ADMIN"]),
});

export const userUpdateManagementSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(120, "Nome deve ter no máximo 120 caracteres"),
  email: z.string().trim().email("Email inválido"),
  senha: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(128, "Senha deve ter no máximo 128 caracteres")
    .optional(),
  status: z.enum(["ATIVO", "INATIVO"]),
  role: z.enum(["USUARIO", "GESTOR", "ADMIN"]),
});
