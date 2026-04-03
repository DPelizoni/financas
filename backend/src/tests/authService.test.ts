import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../middlewares/errorHandler";
import { User } from "../models/User";
import userRepository from "../repositories/userRepository";
import authService from "../services/authService";
import { TestCase } from "./types";

const createAuthUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  nome: "Auth User",
  email: "auth@teste.com",
  senha: "$2a$10$hash.fake.apenas.para.teste",
  status: "ATIVO",
  role: "USUARIO",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const originalRepositoryMethods = {
  findByEmail: userRepository.findByEmail,
  findById: userRepository.findById,
  create: userRepository.create,
};

const restoreRepository = () => {
  userRepository.findByEmail = originalRepositoryMethods.findByEmail;
  userRepository.findById = originalRepositoryMethods.findById;
  userRepository.create = originalRepositoryMethods.create;
};

const fallbackRoleInvalidaParaUsuario = async () => {
  const token = jwt.sign(
    {
      sub: 10,
      nome: "Ana",
      email: "ana@teste.com",
      status: "ATIVO",
      role: "ROLE_DESCONHECIDA",
    },
    "financas_dev_secret_change_me",
    { expiresIn: "1h" },
  );

  const payload = authService.verifyToken(token);

  assert.equal(payload.sub, 10);
  assert.equal(payload.email, "ana@teste.com");
  assert.equal(payload.role, "USUARIO");
};

const rejeitaTokenPayloadInvalido = async () => {
  const token = jwt.sign(
    {
      sub: 20,
      nome: "Ana",
      email: "ana@teste.com",
      status: "BLOQUEADO",
      role: "ADMIN",
    },
    "financas_dev_secret_change_me",
    { expiresIn: "1h" },
  );

  assert.throws(
    () => authService.verifyToken(token),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 401);
      return true;
    },
  );
};

const bloqueiaLoginUsuarioInativo = async () => {
  try {
    const senha = "senha-segura";
    const senhaHash = await bcrypt.hash(senha, 10);

    userRepository.findByEmail = async () =>
      createAuthUser({
        id: 8,
        email: "inativo@teste.com",
        senha: senhaHash,
        status: "INATIVO",
      });

    await assert.rejects(
      async () =>
        authService.login({
          email: " INATIVO@TESTE.COM ",
          senha,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const normalizaEmailNoCadastroERetornaToken = async () => {
  let emailConsultado = "";
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
    userRepository.findByEmail = async (email) => {
      emailConsultado = email;
      return null;
    };

    userRepository.create = async (input) => {
      createPayload = input;
      return createAuthUser({
        id: 50,
        nome: input.nome,
        email: input.email,
        senha: input.senha,
        status: input.status ?? "ATIVO",
        role: input.role ?? "USUARIO",
      });
    };

    const result = await authService.register({
      nome: "  Ana  ",
      email: " ANA@TESTE.COM ",
      senha: "123456",
    });

    assert.equal(emailConsultado, "ana@teste.com");
    assert.ok(createPayload);
    assert.equal(createPayload.email, "ana@teste.com");
    assert.equal(createPayload.nome, "Ana");
    assert.equal(createPayload.role, "USUARIO");
    assert.notEqual(createPayload.senha, "123456");
    assert.equal(result.usuario.email, "ana@teste.com");
    assert.ok(result.token.length > 20);
  } finally {
    restoreRepository();
  }
};

export const authServiceTests: TestCase[] = [
  {
    name: "AuthService: fallback de role invalida para USUARIO",
    run: fallbackRoleInvalidaParaUsuario,
  },
  {
    name: "AuthService: rejeita payload de token invalido",
    run: rejeitaTokenPayloadInvalido,
  },
  {
    name: "AuthService: bloqueia login de usuario inativo",
    run: bloqueiaLoginUsuarioInativo,
  },
  {
    name: "AuthService: normaliza email no cadastro e retorna token",
    run: normalizaEmailNoCadastroERetornaToken,
  },
];
