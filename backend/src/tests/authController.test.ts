import assert from "node:assert/strict";
import authController from "../controllers/authController";
import authService from "../services/authService";
import { createMockRequest, createMockResponse, createNextSpy } from "./helpers/httpMocks";
import { TestCase } from "./types";

const originalAuthServiceMethods = {
  register: authService.register,
  login: authService.login,
  getMe: authService.getMe,
};

const restoreAuthService = () => {
  authService.register = originalAuthServiceMethods.register;
  authService.login = originalAuthServiceMethods.login;
  authService.getMe = originalAuthServiceMethods.getMe;
};

const registerRetorna201ComPayload = async () => {
  const expectedData = {
    token: "jwt-token",
    usuario: { id: 1, nome: "Ana" },
  };

  try {
    authService.register = async (input) => {
      assert.deepEqual(input, { nome: "Ana", email: "ana@teste.com", senha: "123456" });
      return expectedData as Awaited<ReturnType<typeof authService.register>>;
    };

    const req = createMockRequest({
      body: { nome: "Ana", email: "ana@teste.com", senha: "123456" },
    });
    const { res, getStatusCode, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await authController.register(req, res, next);

    assert.equal(calls.length, 0);
    assert.equal(getStatusCode(), 201);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Usuário cadastrado com sucesso",
      data: expectedData,
    });
  } finally {
    restoreAuthService();
  }
};

const registerEncaminhaErroParaNext = async () => {
  const expectedError = new Error("falha no cadastro");

  try {
    authService.register = async () => {
      throw expectedError;
    };

    const req = createMockRequest({ body: { nome: "Ana" } });
    const { res } = createMockResponse();
    const { next, calls } = createNextSpy();

    await authController.register(req, res, next);

    assert.equal(calls.length, 1);
    assert.equal(calls[0], expectedError);
  } finally {
    restoreAuthService();
  }
};

const meRetorna401QuandoNaoAutenticado = async () => {
  let getMeCalled = false;

  try {
    authService.getMe = async () => {
      getMeCalled = true;
      return {} as Awaited<ReturnType<typeof authService.getMe>>;
    };

    const req = createMockRequest();
    const { res, getStatusCode, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await authController.me(req, res, next);

    assert.equal(getMeCalled, false);
    assert.equal(calls.length, 0);
    assert.equal(getStatusCode(), 401);
    assert.deepEqual(getJsonBody(), {
      success: false,
      message: "Usuário não autenticado",
      errors: undefined,
    });
  } finally {
    restoreAuthService();
  }
};

const meRetornaUsuarioQuandoAutenticado = async () => {
  const user = {
    id: 77,
    nome: "Gestor",
    email: "gestor@teste.com",
    role: "GESTOR",
    status: "ATIVO",
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
  };

  try {
    authService.getMe = async (id) => {
      assert.equal(id, 77);
      return user as Awaited<ReturnType<typeof authService.getMe>>;
    };

    const req = createMockRequest({
      user: {
        id: 77,
        nome: "Gestor",
        email: "gestor@teste.com",
        role: "GESTOR",
        status: "ATIVO",
      },
    });
    const { res, getStatusCode, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await authController.me(req, res, next);

    assert.equal(calls.length, 0);
    assert.equal(getStatusCode(), 200);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Usuário autenticado",
      data: user,
    });
  } finally {
    restoreAuthService();
  }
};

const logoutRetornaSucesso = async () => {
  const req = createMockRequest();
  const { res, getStatusCode, getJsonBody } = createMockResponse();

  await authController.logout(req, res);

  assert.equal(getStatusCode(), 200);
  assert.deepEqual(getJsonBody(), {
    success: true,
    message: "Logout realizado com sucesso",
    data: undefined,
  });
};

export const authControllerTests: TestCase[] = [
  {
    name: "AuthController: register retorna 201 com payload de sucesso",
    run: registerRetorna201ComPayload,
  },
  {
    name: "AuthController: register encaminha erro para next",
    run: registerEncaminhaErroParaNext,
  },
  {
    name: "AuthController: me retorna 401 sem usuario autenticado",
    run: meRetorna401QuandoNaoAutenticado,
  },
  {
    name: "AuthController: me retorna usuario autenticado",
    run: meRetornaUsuarioQuandoAutenticado,
  },
  {
    name: "AuthController: logout retorna sucesso",
    run: logoutRetornaSucesso,
  },
];
