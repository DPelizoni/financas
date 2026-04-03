import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import userController from "../controllers/userController";
import userService from "../services/userService";
import { createMockRequest, createMockResponse, createNextSpy } from "./helpers/httpMocks";
import { TestCase } from "./types";

const originalUserServiceMethods = {
  createUser: userService.createUser,
  listUsers: userService.listUsers,
  updateStatus: userService.updateStatus,
  updateRole: userService.updateRole,
  updateUser: userService.updateUser,
  deleteUser: userService.deleteUser,
};

const restoreUserService = () => {
  userService.createUser = originalUserServiceMethods.createUser;
  userService.listUsers = originalUserServiceMethods.listUsers;
  userService.updateStatus = originalUserServiceMethods.updateStatus;
  userService.updateRole = originalUserServiceMethods.updateRole;
  userService.updateUser = originalUserServiceMethods.updateUser;
  userService.deleteUser = originalUserServiceMethods.deleteUser;
};

const createFalhaQuandoNaoAutenticado = async () => {
  const req = createMockRequest({
    body: { nome: "Novo User" },
  });
  const { res } = createMockResponse();
  const { next, calls } = createNextSpy();

  await userController.create(req, res, next);

  assert.equal(calls.length, 1);
  assert.ok(calls[0] instanceof AppError);
  assert.equal((calls[0] as AppError).statusCode, 401);
};

const createRetorna201QuandoSucesso = async () => {
  const createdUser = {
    id: 5,
    nome: "Criado",
    email: "criado@teste.com",
    status: "ATIVO",
    role: "USUARIO",
  };

  try {
    userService.createUser = async (input, currentRole) => {
      assert.deepEqual(input, {
        nome: "Criado",
        email: "criado@teste.com",
        senha: "123456",
        status: "ATIVO",
        role: "USUARIO",
      });
      assert.equal(currentRole, "GESTOR");
      return createdUser as Awaited<ReturnType<typeof userService.createUser>>;
    };

    const req = createMockRequest({
      user: {
        id: 10,
        nome: "Gestor",
        email: "gestor@teste.com",
        status: "ATIVO",
        role: "GESTOR",
      },
      body: {
        nome: "Criado",
        email: "criado@teste.com",
        senha: "123456",
        status: "ATIVO",
        role: "USUARIO",
      },
    });
    const { res, getStatusCode, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await userController.create(req, res, next);

    assert.equal(calls.length, 0);
    assert.equal(getStatusCode(), 201);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Usuário criado com sucesso",
      data: createdUser,
    });
  } finally {
    restoreUserService();
  }
};

const listParseiaQueryERetornaPaginado = async () => {
  try {
    userService.listUsers = async (filters) => {
      assert.deepEqual(filters, {
        search: "ana",
        status: "ATIVO",
        role: "ADMIN",
        page: 2,
        limit: 25,
      });
      return {
        users: [{ id: 1, nome: "Ana" }] as Awaited<
          ReturnType<typeof userService.listUsers>
        >["users"],
        total: 40,
      };
    };

    const req = createMockRequest({
      query: {
        search: "ana",
        status: "ATIVO",
        role: "ADMIN",
        page: "2",
        limit: "25",
      },
    });
    const { res, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await userController.list(req, res, next);

    assert.equal(calls.length, 0);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Usuários listados com sucesso",
      data: [{ id: 1, nome: "Ana" }],
      pagination: {
        page: 2,
        limit: 25,
        total: 40,
        totalPages: 2,
      },
    });
  } finally {
    restoreUserService();
  }
};

const updateRoleFalhaSemUsuarioAutenticado = async () => {
  const req = createMockRequest({
    params: { id: "2" },
    body: { role: "ADMIN" },
  });
  const { res } = createMockResponse();
  const { next, calls } = createNextSpy();

  await userController.updateRole(req, res, next);

  assert.equal(calls.length, 1);
  assert.ok(calls[0] instanceof AppError);
  assert.equal((calls[0] as AppError).statusCode, 401);
};

const deleteChamaServiceComIdAlvoEAtual = async () => {
  let called = false;

  try {
    userService.deleteUser = async (id, currentUserId) => {
      called = true;
      assert.equal(id, 9);
      assert.equal(currentUserId, 1);
    };

    const req = createMockRequest({
      params: { id: "9" },
      user: {
        id: 1,
        nome: "Admin",
        email: "admin@teste.com",
        status: "ATIVO",
        role: "ADMIN",
      },
    });
    const { res, getStatusCode, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await userController.delete(req, res, next);

    assert.equal(called, true);
    assert.equal(calls.length, 0);
    assert.equal(getStatusCode(), 200);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Usuário excluído com sucesso",
      data: undefined,
    });
  } finally {
    restoreUserService();
  }
};

export const userControllerTests: TestCase[] = [
  {
    name: "UserController: create falha sem autenticacao",
    run: createFalhaQuandoNaoAutenticado,
  },
  {
    name: "UserController: create retorna 201 quando sucesso",
    run: createRetorna201QuandoSucesso,
  },
  {
    name: "UserController: list parseia query e retorna paginado",
    run: listParseiaQueryERetornaPaginado,
  },
  {
    name: "UserController: updateRole falha sem usuario autenticado",
    run: updateRoleFalhaSemUsuarioAutenticado,
  },
  {
    name: "UserController: delete chama service e retorna sucesso",
    run: deleteChamaServiceComIdAlvoEAtual,
  },
];
