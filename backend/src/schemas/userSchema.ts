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
