import { z } from "zod";

export const descricaoCreateSchema = z.object({
  nome: z.string().min(2).max(100),
  categoria_id: z.number().int().positive(),
  ativo: z.boolean().default(true),
});

export const descricaoUpdateSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  categoria_id: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
});

export type DescricaoCreateInput = z.infer<typeof descricaoCreateSchema>;
export type DescricaoUpdateInput = z.infer<typeof descricaoUpdateSchema>;
