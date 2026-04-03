import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { User } from "../models/User";
import userRepository from "../repositories/userRepository";
import userService from "../services/userService";
import { TestCase } from "./transacaoService.test";

const createUserRecord = (overrides: Partial<User> = {}): User => ({
  id: 1,
  nome: "Usuario Base",
  email: "usuario@teste.com",
  senha: "$2a$10$hash.fake.apenas.para.teste",
  status: "ATIVO",
  role: "USUARIO",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const originalRepositoryMethods = {
  findById: userRepository.findById,
  findByEmail: userRepository.findByEmail,
  create: userRepository.create,
  updateUser: userRepository.updateUser,
  countByRole: userRepository.countByRole,
  countActiveByRole: userRepository.countActiveByRole,
  delete: userRepository.delete,
};

const restoreRepository = () => {
  userRepository.findById = originalRepositoryMethods.findById;
  userRepository.findByEmail = originalRepositoryMethods.findByEmail;
  userRepository.create = originalRepositoryMethods.create;
  userRepository.updateUser = originalRepositoryMethods.updateUser;
  userRepository.countByRole = originalRepositoryMethods.countByRole;
  userRepository.countActiveByRole = originalRepositoryMethods.countActiveByRole;
  userRepository.delete = originalRepositoryMethods.delete;
};

const forcaRoleUsuarioQuandoNaoAdmin = async () => {
  let createPayload:
    | {
        nome: string;
        email: string;
        senha: string;
        status?: "ATIVO" | "INATIVO";
        role?: "USUARIO" | "GESTOR" | "ADMIN";
      }
    | undefined;

  try {
    userRepository.findByEmail = async () => null;
    userRepository.create = async (input) => {
      createPayload = input;
      return createUserRecord({
        id: 11,
        nome: input.nome,
        email: input.email,
        senha: input.senha,
        status: input.status ?? "ATIVO",
        role: input.role ?? "USUARIO",
      });
    };

    const result = await userService.createUser(
      {
        nome: "  Ana  ",
        email: "  ANA@TESTE.COM ",
        senha: "123456",
        status: "ATIVO",
        role: "ADMIN",
      },
      "GESTOR",
    );

    assert.ok(createPayload);
    assert.equal(createPayload.email, "ana@teste.com");
    assert.equal(createPayload.role, "USUARIO");
    assert.equal(createPayload.nome, "Ana");
    assert.notEqual(createPayload.senha, "123456");
    assert.equal(result.email, "ana@teste.com");
    assert.equal(result.role, "USUARIO");
  } finally {
    restoreRepository();
  }
};

const impedeGestorDeAlterarRole = async () => {
  try {
    userRepository.findById = async () =>
      createUserRecord({
        id: 40,
        email: "alvo@teste.com",
        role: "USUARIO",
      });

    await assert.rejects(
      async () =>
        userService.updateUser(
          40,
          {
            nome: "Alvo",
            email: "alvo@teste.com",
            status: "ATIVO",
            role: "ADMIN",
          },
          { id: 7, role: "GESTOR" },
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 403);
        assert.match(error.message, /somente admin/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const impedeAutoInativacao = async () => {
  try {
    userRepository.findById = async () =>
      createUserRecord({
        id: 9,
        email: "eu@teste.com",
        role: "USUARIO",
      });

    await assert.rejects(
      async () =>
        userService.updateUser(
          9,
          {
            nome: "Eu Mesmo",
            email: "eu@teste.com",
            status: "INATIVO",
            role: "USUARIO",
          },
          { id: 9, role: "USUARIO" },
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.match(error.message, /inativar/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const impedeExcluirUltimoAdmin = async () => {
  try {
    userRepository.findById = async () =>
      createUserRecord({
        id: 100,
        role: "ADMIN",
        status: "ATIVO",
      });
    userRepository.countByRole = async () => 1;
    userRepository.countActiveByRole = async () => 1;

    await assert.rejects(
      async () => userService.deleteUser(100, 1),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.match(error.message, /ADMIN do sistema/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

export const userServiceTests: TestCase[] = [
  {
    name: "UserService: forca role USUARIO para criador nao ADMIN",
    run: forcaRoleUsuarioQuandoNaoAdmin,
  },
  {
    name: "UserService: impede GESTOR de alterar role",
    run: impedeGestorDeAlterarRole,
  },
  {
    name: "UserService: impede auto inativacao",
    run: impedeAutoInativacao,
  },
  {
    name: "UserService: impede exclusao do ultimo ADMIN",
    run: impedeExcluirUltimoAdmin,
  },
];
