import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { Descricao } from "../models/Descricao";
import categoryRepository from "../repositories/categoryRepository";
import descricaoRepository from "../repositories/descricaoRepository";
import descricaoService from "../services/descricaoService";
import { TestCase } from "./types";

const createDescricaoRecord = (
  overrides: Partial<Descricao> = {},
): Descricao => ({
  id: 1,
  nome: "Descrição Base",
  categoria_id: 2,
  ativo: true,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const originalDescricaoRepositoryMethods = {
  findAll: descricaoRepository.findAll,
  findById: descricaoRepository.findById,
  exists: descricaoRepository.exists,
  create: descricaoRepository.create,
  update: descricaoRepository.update,
  delete: descricaoRepository.delete,
};

const originalCategoryRepositoryMethods = {
  exists: categoryRepository.exists,
};

const restoreRepositories = () => {
  descricaoRepository.findAll = originalDescricaoRepositoryMethods.findAll;
  descricaoRepository.findById = originalDescricaoRepositoryMethods.findById;
  descricaoRepository.exists = originalDescricaoRepositoryMethods.exists;
  descricaoRepository.create = originalDescricaoRepositoryMethods.create;
  descricaoRepository.update = originalDescricaoRepositoryMethods.update;
  descricaoRepository.delete = originalDescricaoRepositoryMethods.delete;
  categoryRepository.exists = originalCategoryRepositoryMethods.exists;
};

const getAllRetornaDescricoesPaginadas = async () => {
  try {
    descricaoRepository.findAll = async (filters) => {
      assert.equal(filters.search, "far");
      return {
        descricoes: [createDescricaoRecord({ id: 6, nome: "Farmacia" })],
        total: 1,
      };
    };

    const result = await descricaoService.getAllDescricoes({
      search: "far",
      page: 1,
      limit: 10,
    });

    assert.equal(result.total, 1);
    assert.equal(result.descricoes.length, 1);
    assert.equal(result.descricoes[0].id, 6);
  } finally {
    restoreRepositories();
  }
};

const getAllConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    descricaoRepository.findAll = async () => {
      throw new Error("falha ao listar descricoes");
    };

    await assert.rejects(
      async () => descricaoService.getAllDescricoes({ page: 1, limit: 10 }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /listar descri/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepositories();
  }
};

const getByIdRetorna404QuandoNaoExiste = async () => {
  try {
    descricaoRepository.findById = async () => null;

    await assert.rejects(
      async () => descricaoService.getDescricaoById(7),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /descri/i);
        return true;
      },
    );
  } finally {
    restoreRepositories();
  }
};

const getByIdConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    descricaoRepository.findById = async () => {
      throw new Error("falha ao buscar descricao");
    };

    await assert.rejects(
      async () => descricaoService.getDescricaoById(7),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /buscar descri/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepositories();
  }
};

const createFalhaQuandoCategoriaNaoExiste = async () => {
  try {
    categoryRepository.exists = async (id: number) => {
      assert.equal(id, 99);
      return false;
    };

    await assert.rejects(
      async () =>
        descricaoService.createDescricao({
          nome: "Streaming",
          categoria_id: 99,
          ativo: true,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /categoria n[aã]o encontrada/i);
        return true;
      },
    );
  } finally {
    restoreRepositories();
  }
};

const createConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    categoryRepository.exists = async () => true;
    descricaoRepository.create = async () => {
      throw new Error("falha ao criar descricao");
    };

    await assert.rejects(
      async () =>
        descricaoService.createDescricao({
          nome: "Erro Criacao",
          categoria_id: 3,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /criar descri/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepositories();
  }
};

const updateValidaCategoriaQuandoInformada = async () => {
  try {
    descricaoRepository.exists = async (id: number) => {
      assert.equal(id, 4);
      return true;
    };
    categoryRepository.exists = async (id: number) => {
      assert.equal(id, 123);
      return false;
    };

    await assert.rejects(
      async () => descricaoService.updateDescricao(4, { categoria_id: 123 }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /categoria n[aã]o encontrada/i);
        return true;
      },
    );
  } finally {
    restoreRepositories();
  }
};

const updateRetorna404QuandoDescricaoNaoExiste = async () => {
  try {
    descricaoRepository.exists = async () => false;

    await assert.rejects(
      async () => descricaoService.updateDescricao(90, { nome: "Nao Existe" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /descri/i);
        return true;
      },
    );
  } finally {
    restoreRepositories();
  }
};

const updateRetornaDescricaoAtualizadaQuandoDadosValidos = async () => {
  try {
    descricaoRepository.exists = async () => true;
    categoryRepository.exists = async () => true;
    descricaoRepository.update = async (id, input) => {
      assert.equal(id, 4);
      assert.equal(input.nome, "Atualizada");
      assert.equal(input.categoria_id, 9);
      return createDescricaoRecord({
        id,
        nome: input.nome || "Atualizada",
        categoria_id: input.categoria_id || 9,
      });
    };

    const result = await descricaoService.updateDescricao(4, {
      nome: "Atualizada",
      categoria_id: 9,
    });

    assert.equal(result.id, 4);
    assert.equal(result.nome, "Atualizada");
    assert.equal(result.categoria_id, 9);
  } finally {
    restoreRepositories();
  }
};

const updateConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    descricaoRepository.exists = async () => true;
    descricaoRepository.update = async () => {
      throw new Error("falha ao atualizar descricao");
    };

    await assert.rejects(
      async () => descricaoService.updateDescricao(4, { nome: "Erro Update" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /atualizar descri/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepositories();
  }
};

const deleteMapeiaErroDeFKParaConflito = async () => {
  try {
    descricaoRepository.exists = async () => true;
    descricaoRepository.delete = async () => {
      const error = new Error("foreign key") as Error & { code?: string };
      error.code = "ER_ROW_IS_REFERENCED_2";
      throw error;
    };

    await assert.rejects(
      async () => descricaoService.deleteDescricao(2),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /n[aã]o [ée] poss[íi]vel excluir esta descri[çc][ãa]o/i);
        return true;
      },
    );
  } finally {
    restoreRepositories();
  }
};

const deleteRetorna404QuandoDescricaoNaoExiste = async () => {
  try {
    descricaoRepository.exists = async () => false;

    await assert.rejects(
      async () => descricaoService.deleteDescricao(2),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /descri/i);
        return true;
      },
    );
  } finally {
    restoreRepositories();
  }
};

const deleteConverteErroGenericoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    descricaoRepository.exists = async () => true;
    descricaoRepository.delete = async () => {
      throw new Error("falha generica");
    };

    await assert.rejects(
      async () => descricaoService.deleteDescricao(2),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /deletar descri/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepositories();
  }
};

const deleteConcluiQuandoRepositorioExecuta = async () => {
  let deletedId: number | undefined;

  try {
    descricaoRepository.exists = async () => true;
    descricaoRepository.delete = async (id: number) => {
      deletedId = id;
      return true;
    };

    await descricaoService.deleteDescricao(3);
    assert.equal(deletedId, 3);
  } finally {
    restoreRepositories();
  }
};

const createComCategoriaValidaPersisteRegistro = async () => {
  try {
    categoryRepository.exists = async () => true;
    descricaoRepository.create = async (input) => {
      assert.deepEqual(input, {
        nome: "Farmácia",
        categoria_id: 3,
        ativo: true,
      });
      return createDescricaoRecord({
        id: 10,
        nome: input.nome,
        categoria_id: input.categoria_id,
        ativo: input.ativo ?? true,
      });
    };

    const result = await descricaoService.createDescricao({
      nome: "Farmácia",
      categoria_id: 3,
      ativo: true,
    });

    assert.equal(result.id, 10);
    assert.equal(result.nome, "Farmácia");
    assert.equal(result.categoria_id, 3);
  } finally {
    restoreRepositories();
  }
};

export const descricaoServiceTests: TestCase[] = [
  {
    name: "DescricaoService: getAll retorna descricoes paginadas",
    run: getAllRetornaDescricoesPaginadas,
  },
  {
    name: "DescricaoService: getAll converte erro desconhecido para 500",
    run: getAllConverteErroDesconhecidoPara500,
  },
  {
    name: "DescricaoService: getById retorna 404 quando nao existe",
    run: getByIdRetorna404QuandoNaoExiste,
  },
  {
    name: "DescricaoService: getById converte erro desconhecido para 500",
    run: getByIdConverteErroDesconhecidoPara500,
  },
  {
    name: "DescricaoService: create falha quando categoria nao existe",
    run: createFalhaQuandoCategoriaNaoExiste,
  },
  {
    name: "DescricaoService: create converte erro desconhecido para 500",
    run: createConverteErroDesconhecidoPara500,
  },
  {
    name: "DescricaoService: update valida categoria quando informada",
    run: updateValidaCategoriaQuandoInformada,
  },
  {
    name: "DescricaoService: update retorna 404 quando descricao nao existe",
    run: updateRetorna404QuandoDescricaoNaoExiste,
  },
  {
    name: "DescricaoService: update retorna descricao atualizada",
    run: updateRetornaDescricaoAtualizadaQuandoDadosValidos,
  },
  {
    name: "DescricaoService: update converte erro desconhecido para 500",
    run: updateConverteErroDesconhecidoPara500,
  },
  {
    name: "DescricaoService: delete mapeia erro de FK para 409",
    run: deleteMapeiaErroDeFKParaConflito,
  },
  {
    name: "DescricaoService: delete retorna 404 quando descricao nao existe",
    run: deleteRetorna404QuandoDescricaoNaoExiste,
  },
  {
    name: "DescricaoService: delete converte erro generico para 500",
    run: deleteConverteErroGenericoPara500,
  },
  {
    name: "DescricaoService: delete conclui quando repositorio executa",
    run: deleteConcluiQuandoRepositorioExecuta,
  },
  {
    name: "DescricaoService: create persiste quando categoria existe",
    run: createComCategoriaValidaPersisteRegistro,
  },
];
