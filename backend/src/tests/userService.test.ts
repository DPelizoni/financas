import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { User } from "../models/User";
import userRepository from "../repositories/userRepository";
import userService from "../services/userService";
import { TestCase } from "./types";

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
  findAll: userRepository.findAll,
  exists: userRepository.exists,
  updateStatus: userRepository.updateStatus,
  updateRole: userRepository.updateRole,
  findById: userRepository.findById,
  findByEmail: userRepository.findByEmail,
  create: userRepository.create,
  updateUser: userRepository.updateUser,
  countByRole: userRepository.countByRole,
  countActiveByRole: userRepository.countActiveByRole,
  delete: userRepository.delete,
};

const restoreRepository = () => {
  userRepository.findAll = originalRepositoryMethods.findAll;
  userRepository.exists = originalRepositoryMethods.exists;
  userRepository.updateStatus = originalRepositoryMethods.updateStatus;
  userRepository.updateRole = originalRepositoryMethods.updateRole;
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

const listaUsuariosRetornaDadosPublicos = async () => {
  try {
    userRepository.findAll = async () => ({
      users: [
        createUserRecord({
          id: 22,
          nome: "Lista",
          email: "lista@teste.com",
          senha: "hash-interno",
          role: "GESTOR",
        }),
      ],
      total: 1,
    });

    const result = await userService.listUsers({
      search: "lista",
      page: 1,
      limit: 10,
    });

    assert.equal(result.total, 1);
    assert.equal(result.users.length, 1);
    assert.equal(result.users[0].id, 22);
    assert.equal(result.users[0].email, "lista@teste.com");
    assert.equal(
      Object.prototype.hasOwnProperty.call(result.users[0], "senha"),
      false,
    );
  } finally {
    restoreRepository();
  }
};

const listaUsuariosConverteErroDesconhecido = async () => {
  try {
    userRepository.findAll = async () => {
      throw new Error("falha de banco");
    };

    await assert.rejects(
      async () => userService.listUsers({ page: 1, limit: 10 }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /listar usu/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const updateStatusRetorna404QuandoUsuarioNaoExiste = async () => {
  try {
    userRepository.exists = async () => false;

    await assert.rejects(
      async () => userService.updateStatus(90, { status: "INATIVO" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /usu/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const updateStatusRetornaUsuarioPublicoQuandoSucesso = async () => {
  try {
    userRepository.exists = async () => true;
    userRepository.updateStatus = async () =>
      createUserRecord({
        id: 91,
        status: "INATIVO",
      });

    const result = await userService.updateStatus(91, { status: "INATIVO" });

    assert.equal(result.id, 91);
    assert.equal(result.status, "INATIVO");
    assert.equal(
      Object.prototype.hasOwnProperty.call(result, "senha"),
      false,
    );
  } finally {
    restoreRepository();
  }
};

const updateRoleBloqueiaAutoRebaixamentoDeAdmin = async () => {
  try {
    userRepository.findById = async () =>
      createUserRecord({
        id: 33,
        role: "ADMIN",
      });

    await assert.rejects(
      async () =>
        userService.updateRole(33, { role: "GESTOR" }, 33),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.match(error.message, /pr[oó]prio papel de admin/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const updateRoleAtualizaQuandoValido = async () => {
  try {
    userRepository.findById = async () =>
      createUserRecord({
        id: 44,
        role: "USUARIO",
      });
    userRepository.updateRole = async (id, input) =>
      createUserRecord({
        id,
        role: input.role,
      });

    const result = await userService.updateRole(44, { role: "GESTOR" }, 1);

    assert.equal(result.id, 44);
    assert.equal(result.role, "GESTOR");
    assert.equal(
      Object.prototype.hasOwnProperty.call(result, "senha"),
      false,
    );
  } finally {
    restoreRepository();
  }
};

const createUserBloqueiaEmailDuplicado = async () => {
  try {
    userRepository.findByEmail = async () =>
      createUserRecord({
        id: 70,
        email: "duplicado@teste.com",
      });

    await assert.rejects(
      async () =>
        userService.createUser(
          {
            nome: "Duplicado",
            email: "duplicado@teste.com",
            senha: "123456",
            status: "ATIVO",
            role: "USUARIO",
          },
          "ADMIN",
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /j[aá] existe/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const createUserExigeSenha = async () => {
  try {
    userRepository.findByEmail = async () => null;

    await assert.rejects(
      async () =>
        userService.createUser(
          {
            nome: "Sem Senha",
            email: "semsenha@teste.com",
            status: "ATIVO",
            role: "USUARIO",
          },
          "ADMIN",
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.match(error.message, /senha/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const updateUserBloqueiaEmailJaUsadoPorOutroUsuario = async () => {
  try {
    userRepository.findById = async () =>
      createUserRecord({
        id: 80,
        email: "atual@teste.com",
        role: "USUARIO",
      });
    userRepository.findByEmail = async () =>
      createUserRecord({
        id: 81,
        email: "novo@teste.com",
      });

    await assert.rejects(
      async () =>
        userService.updateUser(
          80,
          {
            nome: "Atualizado",
            email: "novo@teste.com",
            status: "ATIVO",
            role: "USUARIO",
          },
          { id: 1, role: "ADMIN" },
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /j[aá] existe/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const updateUserAdminComSenhaAtualizaComNormalizacao = async () => {
  let updatePayload:
    | {
        nome: string;
        email: string;
        senha?: string;
        status: "ATIVO" | "INATIVO";
        role: "USUARIO" | "GESTOR" | "ADMIN";
      }
    | undefined;

  try {
    userRepository.findById = async () =>
      createUserRecord({
        id: 82,
        nome: "Original",
        email: "original@teste.com",
        role: "USUARIO",
      });
    userRepository.findByEmail = async () => null;
    userRepository.updateUser = async (id, input) => {
      updatePayload = input;
      return createUserRecord({
        id,
        nome: input.nome,
        email: input.email,
        senha: input.senha || "sem-senha",
        status: input.status,
        role: input.role,
      });
    };

    const result = await userService.updateUser(
      82,
      {
        nome: "  Usuario Atualizado  ",
        email: "  NOVO@TESTE.COM ",
        senha: "nova-senha",
        status: "ATIVO",
        role: "ADMIN",
      },
      { id: 1, role: "ADMIN" },
    );

    assert.ok(updatePayload);
    assert.equal(updatePayload.nome, "Usuario Atualizado");
    assert.equal(updatePayload.email, "novo@teste.com");
    assert.equal(updatePayload.role, "ADMIN");
    assert.ok(updatePayload.senha);
    assert.notEqual(updatePayload.senha, "nova-senha");
    assert.equal(result.email, "novo@teste.com");
    assert.equal(result.role, "ADMIN");
  } finally {
    restoreRepository();
  }
};

const deleteUserRetornaErroQuandoRepositorioNaoExclui = async () => {
  try {
    userRepository.findById = async () =>
      createUserRecord({
        id: 95,
        role: "USUARIO",
      });
    userRepository.delete = async () => false;

    await assert.rejects(
      async () => userService.deleteUser(95, 1),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /excluir usu/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const deleteUserConcluiQuandoRepositorioExclui = async () => {
  let deletedId: number | undefined;

  try {
    userRepository.findById = async () =>
      createUserRecord({
        id: 96,
        role: "USUARIO",
      });
    userRepository.delete = async (id: number) => {
      deletedId = id;
      return true;
    };

    await userService.deleteUser(96, 1);

    assert.equal(deletedId, 96);
  } finally {
    restoreRepository();
  }
};

export const userServiceTests: TestCase[] = [
  {
    name: "UserService: listUsers retorna apenas campos publicos",
    run: listaUsuariosRetornaDadosPublicos,
  },
  {
    name: "UserService: listUsers converte erro desconhecido para 500",
    run: listaUsuariosConverteErroDesconhecido,
  },
  {
    name: "UserService: forca role USUARIO para criador nao ADMIN",
    run: forcaRoleUsuarioQuandoNaoAdmin,
  },
  {
    name: "UserService: updateStatus retorna 404 quando usuario nao existe",
    run: updateStatusRetorna404QuandoUsuarioNaoExiste,
  },
  {
    name: "UserService: updateStatus retorna usuario publico em sucesso",
    run: updateStatusRetornaUsuarioPublicoQuandoSucesso,
  },
  {
    name: "UserService: updateRole bloqueia auto rebaixamento de ADMIN",
    run: updateRoleBloqueiaAutoRebaixamentoDeAdmin,
  },
  {
    name: "UserService: updateRole atualiza quando valido",
    run: updateRoleAtualizaQuandoValido,
  },
  {
    name: "UserService: createUser bloqueia email duplicado",
    run: createUserBloqueiaEmailDuplicado,
  },
  {
    name: "UserService: createUser exige senha",
    run: createUserExigeSenha,
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
  {
    name: "UserService: updateUser bloqueia email de outro usuario",
    run: updateUserBloqueiaEmailJaUsadoPorOutroUsuario,
  },
  {
    name: "UserService: updateUser ADMIN atualiza com normalizacao",
    run: updateUserAdminComSenhaAtualizaComNormalizacao,
  },
  {
    name: "UserService: deleteUser retorna 500 quando repositorio falha",
    run: deleteUserRetornaErroQuandoRepositorioNaoExclui,
  },
  {
    name: "UserService: deleteUser conclui quando repositorio remove",
    run: deleteUserConcluiQuandoRepositorioExclui,
  },
];
