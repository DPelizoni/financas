import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;

export const investimentoMovimentacaoTipoSchema = z.enum([
  "APORTE",
  "RESGATE",
  "RENDIMENTO",
]);

export const createInvestimentoAtivoSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter no minimo 2 caracteres")
    .max(120, "Nome deve ter no maximo 120 caracteres"),
  banco_id: z.coerce.number().int().positive("Banco e obrigatorio"),
  saldo_inicial: z.coerce
    .number()
    .min(0, "Saldo inicial nao pode ser negativo"),
  data_saldo_inicial: z
    .string()
    .regex(
      dateRegex,
      "Data do saldo inicial deve estar no formato YYYY-MM-DD ou DD/MM/YYYY",
    ),
  ativo: z.boolean().optional().default(true),
});

export const updateInvestimentoAtivoSchema = createInvestimentoAtivoSchema
  .partial()
  .refine((values) => Object.keys(values).length > 0, {
    message: "Informe ao menos um campo para atualizacao",
  });

export const createInvestimentoMovimentacaoSchema = z.object({
  investimento_ativo_id: z
    .coerce
    .number()
    .int()
    .positive("Ativo e obrigatorio"),
  tipo: investimentoMovimentacaoTipoSchema,
  data: z
    .string()
    .regex(dateRegex, "Data deve estar no formato YYYY-MM-DD ou DD/MM/YYYY"),
  valor: z.coerce.number().positive("Valor deve ser maior que zero"),
});

export const updateInvestimentoMovimentacaoSchema =
  createInvestimentoMovimentacaoSchema
    .partial()
    .refine((values) => Object.keys(values).length > 0, {
      message: "Informe ao menos um campo para atualizacao",
    });
