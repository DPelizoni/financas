import { z } from "zod";

export const registerSchema = z.object({
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
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});
