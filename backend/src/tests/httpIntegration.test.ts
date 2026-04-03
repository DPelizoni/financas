import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../app";
import { AppError } from "../middlewares/errorHandler";
import { User } from "../models/User";
import userRepository from "../repositories/userRepository";
import { authService } from "../services";
import authServiceDefault from "../services/authService";
import { TransacaoService } from "../services/transacaoService";
import userService from "../services/userService";
import { startTestHttpServer } from "./helpers/httpServer";
import { TestCase } from "./types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface HttpCallOptions {
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface HttpCallResult {
  status: number;
  body: unknown;
}

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  nome: "Admin",
  email: "admin@teste.com",
  senha: "hash",
  status: "ATIVO",
  role: "ADMIN",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const originalMethods = {
  authRegister: authServiceDefault.register,
  authVerifyToken: authService.verifyToken,
  userRepoFindById: userRepository.findById,
  userServiceListUsers: userService.listUsers,
  transacaoDeleteByMeses: TransacaoService.prototype.deleteTransacaoByMeses,
};

const restoreMethods = () => {
  authServiceDefault.register = originalMethods.authRegister;
  authService.verifyToken = originalMethods.authVerifyToken;
  userRepository.findById = originalMethods.userRepoFindById;
  userService.listUsers = originalMethods.userServiceListUsers;
  TransacaoService.prototype.deleteTransacaoByMeses =
    originalMethods.transacaoDeleteByMeses;
};

const callHttpJson = async (
  baseUrl: string,
  options: HttpCallOptions,
): Promise<HttpCallResult> => {
  const target = new URL(options.path, baseUrl);
  const payload =
    options.body === undefined ? undefined : JSON.stringify(options.body);

  return new Promise<HttpCallResult>((resolve, reject) => {
    const req = http.request(
      {
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method: options.method,
        headers: {
          ...(payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": String(Buffer.byteLength(payload)),
              }
            : {}),
          ...(options.headers || {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let parsed: unknown = raw;
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch {
              parsed = raw;
            }
          }

          resolve({
            status: res.statusCode || 0,
            body: parsed,
          });
        });
      },
    );

    req.on("error", reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
};

const withAppServer = async (
  run: (baseUrl: string) => Promise<void>,
): Promise<void> => {
  const app = createApp();
  const server = await startTestHttpServer(app);
  try {
    await run(server.baseUrl);
  } finally {
    await server.close();
  }
};

const mockAuthenticatedContext = () => {
  authService.verifyToken = ((token: string) => {
    assert.equal(token, "token-valido");
    return {
      sub: 1,
      nome: "Admin",
      email: "admin@teste.com",
      status: "ATIVO",
      role: "ADMIN",
    };
  }) as typeof authService.verifyToken;

  userRepository.findById = async (id: number) =>
    buildUser({
      id,
      role: "ADMIN",
      email: "admin@teste.com",
    });
};

const registerInvalidoRetorna400 = async () => {
  try {
    await withAppServer(async (baseUrl) => {
      const result = await callHttpJson(baseUrl, {
        method: "POST",
        path: "/api/auth/register",
        body: {
          nome: "A",
          email: "email-invalido",
          senha: "123",
        },
      });

      assert.equal(result.status, 400);
      assert.equal((result.body as { success: boolean }).success, false);
      assert.match(
        String((result.body as { message?: string }).message || ""),
        /valida/i,
      );
    });
  } finally {
    restoreMethods();
  }
};

const registerValidoRetorna201 = async () => {
  const payload = {
    token: "jwt",
    usuario: {
      id: 9,
      nome: "Novo",
      email: "novo@teste.com",
      role: "USUARIO",
      status: "ATIVO",
    },
  };

  try {
    authServiceDefault.register = async () =>
      payload as Awaited<ReturnType<typeof authServiceDefault.register>>;

    await withAppServer(async (baseUrl) => {
      const result = await callHttpJson(baseUrl, {
        method: "POST",
        path: "/api/auth/register",
        body: {
          nome: "Novo",
          email: "novo@teste.com",
          senha: "123456",
        },
      });

      assert.equal(result.status, 201);
      assert.deepEqual(result.body, {
        success: true,
        message: "Usuário cadastrado com sucesso",
        data: payload,
      });
    });
  } finally {
    restoreMethods();
  }
};

const usersSemTokenRetorna401 = async () => {
  try {
    await withAppServer(async (baseUrl) => {
      const result = await callHttpJson(baseUrl, {
        method: "GET",
        path: "/api/users",
      });

      assert.equal(result.status, 401);
      assert.equal((result.body as { success: boolean }).success, false);
      assert.match(
        String((result.body as { message?: string }).message || ""),
        /token/i,
      );
    });
  } finally {
    restoreMethods();
  }
};

const usersComTokenRetornaPaginado = async () => {
  try {
    mockAuthenticatedContext();
    userService.listUsers = async (filters) => {
      assert.deepEqual(filters, {
        search: undefined,
        status: undefined,
        role: undefined,
        page: 2,
        limit: 5,
      });

      return {
        users: [{ id: 1, nome: "Admin" }] as Awaited<
          ReturnType<typeof userService.listUsers>
        >["users"],
        total: 11,
      };
    };

    await withAppServer(async (baseUrl) => {
      const result = await callHttpJson(baseUrl, {
        method: "GET",
        path: "/api/users?page=2&limit=5",
        headers: {
          Authorization: "Bearer token-valido",
        },
      });

      assert.equal(result.status, 200);
      assert.deepEqual(result.body, {
        success: true,
        message: "Usuários listados com sucesso",
        data: [{ id: 1, nome: "Admin" }],
        pagination: {
          page: 2,
          limit: 5,
          total: 11,
          totalPages: 3,
        },
      });
    });
  } finally {
    restoreMethods();
  }
};

const transacaoBatchInvalidoRetorna400 = async () => {
  try {
    mockAuthenticatedContext();

    await withAppServer(async (baseUrl) => {
      const result = await callHttpJson(baseUrl, {
        method: "POST",
        path: "/api/transacoes/batch",
        headers: {
          Authorization: "Bearer token-valido",
        },
        body: {
          transacoes: [],
        },
      });

      assert.equal(result.status, 400);
      assert.equal((result.body as { success: boolean }).success, false);
      assert.match(
        String((result.body as { message?: string }).message || ""),
        /valida/i,
      );
    });
  } finally {
    restoreMethods();
  }
};

const deleteTransactionMonthsPropagaErro = async () => {
  try {
    mockAuthenticatedContext();
    TransacaoService.prototype.deleteTransacaoByMeses = async () => {
      throw new AppError(409, "Conflito de exclusão");
    };

    await withAppServer(async (baseUrl) => {
      const result = await callHttpJson(baseUrl, {
        method: "DELETE",
        path: "/api/transacoes/delete-transaction-months",
        headers: {
          Authorization: "Bearer token-valido",
        },
        body: {
          transacao_id: 1,
          meses: ["03/2026"],
        },
      });

      assert.equal(result.status, 409);
      assert.equal((result.body as { success?: boolean }).success, false);
      assert.equal(
        (result.body as { message?: string }).message,
        "Conflito de exclusão",
      );
    });
  } finally {
    restoreMethods();
  }
};

const rotaInexistenteRetorna404 = async () => {
  try {
    await withAppServer(async (baseUrl) => {
      const result = await callHttpJson(baseUrl, {
        method: "GET",
        path: "/nao-existe",
      });

      assert.equal(result.status, 404);
      assert.equal((result.body as { success: boolean }).success, false);
      assert.match(
        String((result.body as { message?: string }).message || ""),
        /Rota GET \/nao-existe/i,
      );
    });
  } finally {
    restoreMethods();
  }
};

export const httpIntegrationTests: TestCase[] = [
  {
    name: "HTTP Integration: /api/auth/register invalido retorna 400",
    run: registerInvalidoRetorna400,
  },
  {
    name: "HTTP Integration: /api/auth/register valido retorna 201",
    run: registerValidoRetorna201,
  },
  {
    name: "HTTP Integration: /api/users sem token retorna 401",
    run: usersSemTokenRetorna401,
  },
  {
    name: "HTTP Integration: /api/users com token retorna paginado",
    run: usersComTokenRetornaPaginado,
  },
  {
    name: "HTTP Integration: /api/transacoes/batch invalido retorna 400",
    run: transacaoBatchInvalidoRetorna400,
  },
  {
    name: "HTTP Integration: /api/transacoes/delete-transaction-months propaga erro",
    run: deleteTransactionMonthsPropagaErro,
  },
  {
    name: "HTTP Integration: rota inexistente retorna 404",
    run: rotaInexistenteRetorna404,
  },
];
