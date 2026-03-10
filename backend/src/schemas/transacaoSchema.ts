import { z } from "zod";

export const tipoSchema = z.enum(["DESPESA", "RECEITA"]);
export const situacaoSchema = z.enum(["PENDENTE", "PAGO"]);
const mesRegex = /^\d{2}\/\d{4}$|^\d{4}-\d{2}$/;
const vencimentoRegex = /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/;

export const transacaoCreateSchema = z.object({
  mes: z
    .string()
    .regex(mesRegex, "Mês deve estar no formato MM/AAAA (ou YYYY-MM)"),
  vencimento: z
    .string()
    .regex(
      vencimentoRegex,
      "Vencimento deve estar no formato DD/MM/AAAA (ou YYYY-MM-DD)",
    ),
  tipo: tipoSchema,
  categoria_id: z.coerce.number().int().positive("Categoria é obrigatória"),
  descricao_id: z.coerce.number().int().positive("Descrição é obrigatória"),
  banco_id: z.coerce.number().int().positive("Banco é obrigatório"),
  situacao: situacaoSchema.default("PENDENTE"),
  valor: z.coerce
    .number()
    .positive("Valor deve ser maior que zero")
    .refine((v) => Number.isFinite(v), "Valor deve ser um número válido"),
});

export const transacaoUpdateSchema = transacaoCreateSchema.partial();

export const transacaoFiltersSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().optional(),
  tipo: z.enum(["DESPESA", "RECEITA"]).optional(),
  categoria_id: z.number().int().optional(),
  banco_id: z.number().int().optional(),
  situacao: z.enum(["PENDENTE", "PAGO"]).optional(),
  mes: z.string().optional(),
  ano: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
});

export const transacaoCopyMonthSchema = z.object({
  mes_origem: z
    .string()
    .regex(mesRegex, "Mês origem deve estar no formato MM/AAAA (ou YYYY-MM)"),
  meses_destino: z
    .array(
      z
        .string()
        .regex(
          mesRegex,
          "Mês destino deve estar no formato MM/AAAA (ou YYYY-MM)",
        ),
    )
    .min(1, "Informe ao menos um mês de destino"),
});

export const transacaoDeleteMonthsSchema = z.object({
  meses: z
    .array(
      z
        .string()
        .regex(mesRegex, "Mês deve estar no formato MM/AAAA (ou YYYY-MM)"),
    )
    .min(1, "Informe ao menos um mês para exclusão"),
});
