import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { Bank } from "../models/Bank";
import bankRepository from "../repositories/bankRepository";
import bankService from "../services/bankService";
import { TestCase } from "./types";

const createBankRecord = (overrides: Partial<Bank> = {}): Bank => ({
  id: 1,
  nome: "Banco Base",
  codigo: "001",
  cor: "#111111",
  icone: null as unknown as string,
  saldo_inicial: 0,
  ativo: true,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const originalRepositoryMethods = {
  findAll: bankRepository.findAll,
  findById: bankRepository.findById,
  create: bankRepository.create,
  exists: bankRepository.exists,
  update: bankRepository.update,
  delete: bankRepository.delete,
};

const restoreRepository = () => {
  bankRepository.findAll = originalRepositoryMethods.findAll;
  bankRepository.findById = originalRepositoryMethods.findById;
  bankRepository.create = originalRepositoryMethods.create;
  bankRepository.exists = originalRepositoryMethods.exists;
  bankRepository.update = originalRepositoryMethods.update;
  bankRepository.delete = originalRepositoryMethods.delete;
};

const getAllRetornaBancosPaginados = async () => {
  try {
    bankRepository.findAll = async (filters) => {
      assert.equal(filters.search, "ban");
      return {
        banks: [createBankRecord({ id: 2, nome: "Banco Dois" })],
        total: 1,
      };
    };

    const result = await bankService.getAllBanks({
      search: "ban",
      page: 1,
      limit: 10,
    });

    assert.equal(result.total, 1);
    assert.equal(result.banks.length, 1);
    assert.equal(result.banks[0].id, 2);
  } finally {
    restoreRepository();
  }
};

const getAllConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    bankRepository.findAll = async () => {
      throw new Error("falha ao listar bancos");
    };

    await assert.rejects(
      async () => bankService.getAllBanks({ page: 1, limit: 10 }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /listar bancos/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepository();
  }
};

const getByIdRetornaBancoQuandoExiste = async () => {
  try {
    bankRepository.findById = async (id: number) => {
      assert.equal(id, 7);
      return createBankRecord({ id, nome: "Banco Teste" });
    };

    const result = await bankService.getBankById(7);
    assert.equal(result.id, 7);
    assert.equal(result.nome, "Banco Teste");
  } finally {
    restoreRepository();
  }
};

const getByIdConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    bankRepository.findById = async () => {
      throw new Error("falha ao buscar banco");
    };

    await assert.rejects(
      async () => bankService.getBankById(7),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /buscar banco/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepository();
  }
};

const createRetornaBancoCriado = async () => {
  try {
    bankRepository.create = async (input) => {
      assert.equal(input.nome, "Novo Banco");
      return createBankRecord({ id: 11, nome: input.nome });
    };

    const result = await bankService.createBank({
      nome: "Novo Banco",
      saldo_inicial: 250,
    });

    assert.equal(result.id, 11);
    assert.equal(result.nome, "Novo Banco");
  } finally {
    restoreRepository();
  }
};

const createConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    bankRepository.create = async () => {
      throw new Error("falha ao criar banco");
    };

    await assert.rejects(
      async () => bankService.createBank({ nome: "Erro Banco" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /criar banco/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepository();
  }
};

const updateFalhaQuandoBancoNaoExiste = async () => {
  try {
    bankRepository.exists = async () => false;

    await assert.rejects(
      async () => bankService.updateBank(99, { nome: "Atualizado" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /banco n[aã]o encontrado/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const updateRetornaBancoAtualizado = async () => {
  try {
    bankRepository.exists = async () => true;
    bankRepository.update = async (id, input) => {
      assert.equal(id, 5);
      assert.equal(input.nome, "Banco Atualizado");
      return createBankRecord({ id, nome: "Banco Atualizado" });
    };

    const result = await bankService.updateBank(5, { nome: "Banco Atualizado" });

    assert.equal(result.id, 5);
    assert.equal(result.nome, "Banco Atualizado");
  } finally {
    restoreRepository();
  }
};

const updateRetorna500QuandoRepositorioNaoRetornaRegistro = async () => {
  try {
    bankRepository.exists = async () => true;
    bankRepository.update = async () => null;

    await assert.rejects(
      async () => bankService.updateBank(5, { nome: "Sem Retorno" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /atualizar banco/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const updateConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    bankRepository.exists = async () => true;
    bankRepository.update = async () => {
      throw new Error("falha ao atualizar banco");
    };

    await assert.rejects(
      async () => bankService.updateBank(5, { nome: "Erro Update" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /atualizar banco/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepository();
  }
};

const deleteMapeiaErroDeFKParaConflito = async () => {
  try {
    bankRepository.exists = async () => true;
    bankRepository.delete = async () => {
      const error = new Error("foreign key constraint") as Error & {
        code?: string;
      };
      error.code = "ER_ROW_IS_REFERENCED_2";
      throw error;
    };

    await assert.rejects(
      async () => bankService.deleteBank(12),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /n[aã]o [ée] poss[íi]vel excluir este banco/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const deleteFalhaCom404QuandoBancoNaoExiste = async () => {
  try {
    bankRepository.exists = async () => false;

    await assert.rejects(
      async () => bankService.deleteBank(77),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /banco n[aã]o encontrado/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const deleteFalhaCom500QuandoRepositorioNaoExclui = async () => {
  try {
    bankRepository.exists = async () => true;
    bankRepository.delete = async () => false;

    await assert.rejects(
      async () => bankService.deleteBank(78),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /excluir banco/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const deleteConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    bankRepository.exists = async () => true;
    bankRepository.delete = async () => {
      throw new Error("erro generico");
    };

    await assert.rejects(
      async () => bankService.deleteBank(79),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /excluir banco/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepository();
  }
};

const deleteConcluiQuandoRepositorioExclui = async () => {
  let removedId: number | undefined;

  try {
    bankRepository.exists = async () => true;
    bankRepository.delete = async (id: number) => {
      removedId = id;
      return true;
    };

    await bankService.deleteBank(80);
    assert.equal(removedId, 80);
  } finally {
    restoreRepository();
  }
};

export const bankServiceTests: TestCase[] = [
  {
    name: "BankService: getAll retorna bancos paginados",
    run: getAllRetornaBancosPaginados,
  },
  {
    name: "BankService: getAll converte erro desconhecido para 500",
    run: getAllConverteErroDesconhecidoPara500,
  },
  {
    name: "BankService: getById retorna banco quando existe",
    run: getByIdRetornaBancoQuandoExiste,
  },
  {
    name: "BankService: getById converte erro desconhecido para 500",
    run: getByIdConverteErroDesconhecidoPara500,
  },
  {
    name: "BankService: create retorna banco criado",
    run: createRetornaBancoCriado,
  },
  {
    name: "BankService: create converte erro desconhecido para 500",
    run: createConverteErroDesconhecidoPara500,
  },
  {
    name: "BankService: update falha quando banco nao existe",
    run: updateFalhaQuandoBancoNaoExiste,
  },
  {
    name: "BankService: update retorna banco atualizado",
    run: updateRetornaBancoAtualizado,
  },
  {
    name: "BankService: update retorna 500 quando repositorio nao retorna banco",
    run: updateRetorna500QuandoRepositorioNaoRetornaRegistro,
  },
  {
    name: "BankService: update converte erro desconhecido para 500",
    run: updateConverteErroDesconhecidoPara500,
  },
  {
    name: "BankService: delete mapeia erro de FK para 409",
    run: deleteMapeiaErroDeFKParaConflito,
  },
  {
    name: "BankService: delete retorna 404 quando banco nao existe",
    run: deleteFalhaCom404QuandoBancoNaoExiste,
  },
  {
    name: "BankService: delete retorna 500 quando repositorio nao remove",
    run: deleteFalhaCom500QuandoRepositorioNaoExclui,
  },
  {
    name: "BankService: delete converte erro desconhecido para 500",
    run: deleteConverteErroDesconhecidoPara500,
  },
  {
    name: "BankService: delete conclui quando repositorio remove",
    run: deleteConcluiQuandoRepositorioExclui,
  },
];
