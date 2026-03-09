import { z } from "zod";

const categoryTypeSchema = z.enum(["RECEITA", "DESPESA"]);

export const createCategorySchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  tipo: categoryTypeSchema,
  cor: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Cor deve estar no formato hexadecimal (#RRGGBB)",
    )
    .optional()
    .default("#0EA5E9"),
  ativo: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),
  tipo: categoryTypeSchema.optional(),
  cor: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Cor deve estar no formato hexadecimal (#RRGGBB)",
    )
    .optional(),
  ativo: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
