import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { authenticateToken, authorizeRoles } from "../middlewares/authMiddleware";
import { User } from "../models/User";
import userRepository from "../repositories/userRepository";
import { authService } from "../services";
import { TestCase } from "./transacaoService.test";

type RequestLike = {
  headers: Record<string, string | undefined>;
  query: Record<string, unknown>;
  user?: {
    id: number;
    nome: string;
    email: string;
    status: "ATIVO" | "INATIVO";
    role: "USUARIO" | "GESTOR" | "ADMIN";
  };
};

const createUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  nome: "Token User",
  email: "token@teste.com",
  senha: "hash",
  status: "ATIVO",
  role: "USUARIO",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const originalMethods = {
  verifyToken: authService.verifyToken,
  findById: userRepository.findById,
};

const restore = () => {
  authService.verifyToken = originalMethods.verifyToken;
  userRepository.findById = originalMethods.findById;
};

const runAuthMiddleware = async (
  req: RequestLike,
): Promise<{ error?: unknown; req: RequestLike }> => {
  return new Promise((resolve) => {
    let resolved = false;
    const done = (error?: unknown) => {
      if (resolved) return;
      resolved = true;
      resolve({ error, req });
    };

    authenticateToken(
      req as unknown as Parameters<typeof authenticateToken>[0],
      {} as Parameters<typeof authenticateToken>[1],
      done as Parameters<typeof authenticateToken>[2],
    );

    setTimeout(() => done(new Error("next nao foi chamado pelo middleware")), 30);
  });
};

const falhaSemToken = async () => {
  try {
    const { error } = await runAuthMiddleware({
      headers: {},
      query: {},
    });

    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 401);
    assert.match(error.message, /nao informado|não informado/i);
  } finally {
    restore();
  }
};

const sucessoComBearerNoAuthorization = async () => {
  try {
    authService.verifyToken = ((token: string) => {
      assert.equal(token, "token-bom");
      return {
        sub: 22,
        nome: "Ana",
        email: "ana@teste.com",
        status: "ATIVO",
        role: "GESTOR",
      };
    }) as typeof authService.verifyToken;

    userRepository.findById = async (id: number) =>
      createUser({
        id,
        nome: "Ana",
        email: "ana@teste.com",
        role: "GESTOR",
      });

    const { error, req } = await runAuthMiddleware({
      headers: {
        authorization: "  \"Bearer token-bom\"  ",
      },
      query: {},
    });

    assert.equal(error, undefined);
    assert.deepEqual(req.user, {
      id: 22,
      nome: "Ana",
      email: "ana@teste.com",
      status: "ATIVO",
      role: "GESTOR",
    });
  } finally {
    restore();
  }
};

const usaFallbackCookieQuandoSemHeader = async () => {
  try {
    authService.verifyToken = ((token: string) => {
      assert.equal(token, "cookie-token");
      return {
        sub: 8,
        nome: "Cookie User",
        email: "cookie@teste.com",
        status: "ATIVO",
        role: "USUARIO",
      };
    }) as typeof authService.verifyToken;

    userRepository.findById = async () =>
      createUser({
        id: 8,
        nome: "Cookie User",
        email: "cookie@teste.com",
      });

    const { error, req } = await runAuthMiddleware({
      headers: {
        cookie: "foo=bar; auth_token=cookie-token; x=y",
      },
      query: {},
    });

    assert.equal(error, undefined);
    assert.equal(req.user?.id, 8);
  } finally {
    restore();
  }
};

const falhaQuandoUsuarioInexistente = async () => {
  try {
    authService.verifyToken = (() => ({
      sub: 99,
      nome: "Inexistente",
      email: "nao@existe.com",
      status: "ATIVO",
      role: "USUARIO",
    })) as typeof authService.verifyToken;
    userRepository.findById = async () => null;

    const { error } = await runAuthMiddleware({
      headers: { authorization: "Bearer token" },
      query: {},
    });

    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 401);
    assert.match(error.message, /nao encontrado|não encontrado/i);
  } finally {
    restore();
  }
};

const falhaQuandoTokenInvalido = async () => {
  try {
    authService.verifyToken = (() => {
      throw new Error("jwt malformed");
    }) as typeof authService.verifyToken;
    userRepository.findById = async () => createUser();

    const { error } = await runAuthMiddleware({
      headers: { authorization: "Bearer token-ruim" },
      query: {},
    });

    assert.ok(error instanceof AppError);
    assert.equal(error.statusCode, 401);
    assert.match(error.message, /invalido|inválido|expirado/i);
  } finally {
    restore();
  }
};

const authorizeRolesBloqueiaSemUsuario = async () => {
  const middleware = authorizeRoles("ADMIN");

  const error = await new Promise<unknown>((resolve) => {
    middleware(
      { headers: {}, query: {} } as unknown as Parameters<typeof middleware>[0],
      {} as Parameters<typeof middleware>[1],
      (err?: unknown) => resolve(err),
    );
  });

  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, 401);
};

const authorizeRolesBloqueiaPerfilSemPermissao = async () => {
  const middleware = authorizeRoles("ADMIN");

  const error = await new Promise<unknown>((resolve) => {
    middleware(
      {
        user: {
          id: 1,
          nome: "Ana",
          email: "ana@teste.com",
          status: "ATIVO",
          role: "USUARIO",
        },
      } as unknown as Parameters<typeof middleware>[0],
      {} as Parameters<typeof middleware>[1],
      (err?: unknown) => resolve(err),
    );
  });

  assert.ok(error instanceof AppError);
  assert.equal(error.statusCode, 403);
};

const authorizeRolesPermitePerfilCompativel = async () => {
  const middleware = authorizeRoles("ADMIN", "GESTOR");

  const error = await new Promise<unknown>((resolve) => {
    middleware(
      {
        user: {
          id: 2,
          nome: "Gestor",
          email: "gestor@teste.com",
          status: "ATIVO",
          role: "GESTOR",
        },
      } as unknown as Parameters<typeof middleware>[0],
      {} as Parameters<typeof middleware>[1],
      (err?: unknown) => resolve(err),
    );
  });

  assert.equal(error, undefined);
};

export const authMiddlewareTests: TestCase[] = [
  {
    name: "AuthMiddleware: falha quando token nao informado",
    run: falhaSemToken,
  },
  {
    name: "AuthMiddleware: autentica com Authorization Bearer normalizado",
    run: sucessoComBearerNoAuthorization,
  },
  {
    name: "AuthMiddleware: usa token de cookie como fallback",
    run: usaFallbackCookieQuandoSemHeader,
  },
  {
    name: "AuthMiddleware: falha quando usuario do token nao existe",
    run: falhaQuandoUsuarioInexistente,
  },
  {
    name: "AuthMiddleware: transforma erro de token em AppError 401",
    run: falhaQuandoTokenInvalido,
  },
  {
    name: "AuthMiddleware: authorizeRoles bloqueia sem usuario",
    run: authorizeRolesBloqueiaSemUsuario,
  },
  {
    name: "AuthMiddleware: authorizeRoles bloqueia role sem permissao",
    run: authorizeRolesBloqueiaPerfilSemPermissao,
  },
  {
    name: "AuthMiddleware: authorizeRoles permite role autorizada",
    run: authorizeRolesPermitePerfilCompativel,
  },
];
