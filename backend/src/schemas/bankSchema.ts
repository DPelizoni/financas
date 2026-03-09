import { z } from "zod";

export const createBankSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  codigo: z
    .string()
    .max(10, "Código deve ter no máximo 10 caracteres")
    .optional(),
  cor: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Cor deve estar no formato hexadecimal (#RRGGBB)",
    )
    .optional()
    .default("#3B82F6"),
  icone: z
    .string()
    .max(100, "Ícone deve ter no máximo 100 caracteres")
    .optional(),
  saldo_inicial: z.coerce
    .number()
    .min(0, "Saldo inicial não pode ser negativo")
    .optional()
    .default(0),
  ativo: z.boolean().optional().default(true),
});

export const updateBankSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),
  codigo: z
    .string()
    .max(10, "Código deve ter no máximo 10 caracteres")
    .optional(),
  cor: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Cor deve estar no formato hexadecimal (#RRGGBB)",
    )
    .optional(),
  icone: z
    .string()
    .max(100, "Ícone deve ter no máximo 100 caracteres")
    .optional(),
  saldo_inicial: z.coerce
    .number()
    .min(0, "Saldo inicial não pode ser negativo")
    .optional(),
  ativo: z.boolean().optional(),
});

export type CreateBankInput = z.infer<typeof createBankSchema>;
export type UpdateBankInput = z.infer<typeof updateBankSchema>;
