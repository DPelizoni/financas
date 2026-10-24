import { z } from "zod";

const categoryTypeSchema = z.enum(["RECEITA", "DESPESA"]);

export const createCategorySchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  tipo: categoryTypeSchema,
  ativo: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),
  tipo: categoryTypeSchema.optional(),
  ativo: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
