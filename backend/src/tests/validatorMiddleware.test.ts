import assert from "node:assert/strict";
import { z } from "zod";
import { AppError } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validator";
import { TestCase } from "./types";

const validaComSucessoQuandoPayloadEhValido = async () => {
  const schema = z.object({
    email: z.string().email(),
    nome: z.string().min(2),
  });
  const middleware = validate(schema);

  const nextCalls: unknown[] = [];
  middleware(
    {
      body: {
        email: "ana@teste.com",
        nome: "Ana",
      },
    } as Parameters<typeof middleware>[0],
    {} as Parameters<typeof middleware>[1],
    (error?: unknown) => nextCalls.push(error),
  );

  assert.equal(nextCalls.length, 1);
  assert.equal(nextCalls[0], undefined);
};

const retornaAppErrorComDetalhesQuandoPayloadEhInvalido = async () => {
  const schema = z.object({
    email: z.string().email(),
    idade: z.number().int().positive(),
  });
  const middleware = validate(schema);

  assert.throws(
    () =>
      middleware(
        {
          body: {
            email: "email-invalido",
            idade: -2,
          },
        } as Parameters<typeof middleware>[0],
        {} as Parameters<typeof middleware>[1],
        () => undefined,
      ),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /valida/i);
      assert.ok(Array.isArray(error.errors));
      assert.ok((error.errors || []).length >= 2);
      assert.deepEqual((error.errors || [])[0], {
        field: "email",
        message: "Invalid email",
      });
      return true;
    },
  );
};

const encaminhaErroNaoZodParaNext = async () => {
  const schema = {
    parse: () => {
      throw new Error("erro inesperado");
    },
  } as unknown as z.ZodSchema;
  const middleware = validate(schema);

  const nextCalls: unknown[] = [];
  middleware(
    {
      body: { qualquer: "valor" },
    } as Parameters<typeof middleware>[0],
    {} as Parameters<typeof middleware>[1],
    (error?: unknown) => nextCalls.push(error),
  );

  assert.equal(nextCalls.length, 1);
  assert.ok(nextCalls[0] instanceof Error);
  assert.equal((nextCalls[0] as Error).message, "erro inesperado");
};

export const validatorMiddlewareTests: TestCase[] = [
  {
    name: "ValidatorMiddleware: segue fluxo quando payload eh valido",
    run: validaComSucessoQuandoPayloadEhValido,
  },
  {
    name: "ValidatorMiddleware: retorna AppError com erros de validacao",
    run: retornaAppErrorComDetalhesQuandoPayloadEhInvalido,
  },
  {
    name: "ValidatorMiddleware: encaminha erro nao-Zod para next",
    run: encaminhaErroNaoZodParaNext,
  },
];
