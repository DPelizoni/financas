import assert from "node:assert/strict";
import { AppError } from "../middlewares/errorHandler";
import { Category } from "../models/Category";
import categoryRepository from "../repositories/categoryRepository";
import categoryService from "../services/categoryService";
import { TestCase } from "./types";

const createCategoryRecord = (
  overrides: Partial<Category> = {},
): Category => ({
  id: 1,
  nome: "Categoria Base",
  tipo: "DESPESA",
  cor: "#111111",
  ativo: true,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const originalRepositoryMethods = {
  findAll: categoryRepository.findAll,
  findById: categoryRepository.findById,
  create: categoryRepository.create,
  exists: categoryRepository.exists,
  update: categoryRepository.update,
  delete: categoryRepository.delete,
};

const restoreRepository = () => {
  categoryRepository.findAll = originalRepositoryMethods.findAll;
  categoryRepository.findById = originalRepositoryMethods.findById;
  categoryRepository.create = originalRepositoryMethods.create;
  categoryRepository.exists = originalRepositoryMethods.exists;
  categoryRepository.update = originalRepositoryMethods.update;
  categoryRepository.delete = originalRepositoryMethods.delete;
};

const getAllRetornaCategoriasPaginadas = async () => {
  try {
    categoryRepository.findAll = async (filters) => {
      assert.equal(filters.tipo, "DESPESA");
      return {
        categories: [createCategoryRecord({ id: 3, nome: "Lazer" })],
        total: 1,
      };
    };

    const result = await categoryService.getAllCategories({
      tipo: "DESPESA",
      page: 1,
      limit: 10,
    });

    assert.equal(result.total, 1);
    assert.equal(result.categories.length, 1);
    assert.equal(result.categories[0].id, 3);
  } finally {
    restoreRepository();
  }
};

const getAllConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    categoryRepository.findAll = async () => {
      throw new Error("erro ao listar categorias");
    };

    await assert.rejects(
      async () => categoryService.getAllCategories({ page: 1, limit: 10 }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /listar categorias/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepository();
  }
};

const getByIdFalhaCom404QuandoNaoExiste = async () => {
  try {
    categoryRepository.findById = async () => null;

    await assert.rejects(
      async () => categoryService.getCategoryById(10),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /categoria n[aã]o encontrada/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const getByIdConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    categoryRepository.findById = async () => {
      throw new Error("erro ao buscar categoria");
    };

    await assert.rejects(
      async () => categoryService.getCategoryById(10),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /buscar categoria/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepository();
  }
};

const createRetornaCategoriaCriada = async () => {
  try {
    categoryRepository.create = async (input) => {
      assert.equal(input.nome, "Moradia");
      return createCategoryRecord({
        id: 12,
        nome: input.nome,
        tipo: input.tipo,
      });
    };

    const result = await categoryService.createCategory({
      nome: "Moradia",
      tipo: "DESPESA",
      cor: "#222222",
    });

    assert.equal(result.id, 12);
    assert.equal(result.nome, "Moradia");
  } finally {
    restoreRepository();
  }
};

const createPropagaAppError = async () => {
  try {
    categoryRepository.create = async () => {
      throw new AppError(409, "Categoria duplicada");
    };

    await assert.rejects(
      async () =>
        categoryService.createCategory({ nome: "Duplicada", tipo: "DESPESA" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const createConverteErroDesconhecidoPara500 = async () => {
  const originalConsoleError = console.error;

  try {
    console.error = () => undefined;
    categoryRepository.create = async () => {
      throw new Error("erro ao criar categoria");
    };

    await assert.rejects(
      async () =>
        categoryService.createCategory({ nome: "Falha", tipo: "DESPESA" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /criar categoria/i);
        return true;
      },
    );
  } finally {
    console.error = originalConsoleError;
    restoreRepository();
  }
};

const updateRetornaCategoriaAtualizada = async () => {
  try {
    categoryRepository.exists = async (id: number) => {
      assert.equal(id, 8);
      return true;
    };
    categoryRepository.update = async (id, input) => {
      assert.equal(id, 8);
      assert.deepEqual(input, { nome: "Lazer" });
      return createCategoryRecord({ id, nome: "Lazer" });
    };

    const result = await categoryService.updateCategory(8, { nome: "Lazer" });
    assert.equal(result.id, 8);
    assert.equal(result.nome, "Lazer");
  } finally {
    restoreRepository();
  }
};

const updateRetorna404QuandoCategoriaNaoExiste = async () => {
  try {
    categoryRepository.exists = async () => false;

    await assert.rejects(
      async () => categoryService.updateCategory(99, { nome: "Nao Existe" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /categoria n[aã]o encontrada/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const updateRetorna500QuandoRepositorioNaoRetornaCategoria = async () => {
  try {
    categoryRepository.exists = async () => true;
    categoryRepository.update = async () => null;

    await assert.rejects(
      async () => categoryService.updateCategory(8, { nome: "Sem Retorno" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /atualizar categoria/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const deleteMapeiaErroDeFKParaConflito = async () => {
  try {
    categoryRepository.exists = async () => true;
    categoryRepository.delete = async () => {
      const error = new Error("foreign key") as Error & { code?: string };
      error.code = "ER_ROW_IS_REFERENCED";
      throw error;
    };

    await assert.rejects(
      async () => categoryService.deleteCategory(5),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /vinculada a descri[çc][õo]es ou transa[çc][õo]es/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const deleteRetorna404QuandoCategoriaNaoExiste = async () => {
  try {
    categoryRepository.exists = async () => false;

    await assert.rejects(
      async () => categoryService.deleteCategory(7),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /categoria n[aã]o encontrada/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

const deleteRetorna500QuandoRepositorioNaoExclui = async () => {
  try {
    categoryRepository.exists = async () => true;
    categoryRepository.delete = async () => false;

    await assert.rejects(
      async () => categoryService.deleteCategory(8),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /excluir categoria/i);
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
    categoryRepository.exists = async () => true;
    categoryRepository.delete = async () => {
      throw new Error("erro ao excluir categoria");
    };

    await assert.rejects(
      async () => categoryService.deleteCategory(9),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 500);
        assert.match(error.message, /excluir categoria/i);
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
    categoryRepository.exists = async () => true;
    categoryRepository.delete = async (id: number) => {
      removedId = id;
      return true;
    };

    await categoryService.deleteCategory(11);
    assert.equal(removedId, 11);
  } finally {
    restoreRepository();
  }
};

export const categoryServiceTests: TestCase[] = [
  {
    name: "CategoryService: getAll retorna categorias paginadas",
    run: getAllRetornaCategoriasPaginadas,
  },
  {
    name: "CategoryService: getAll converte erro desconhecido para 500",
    run: getAllConverteErroDesconhecidoPara500,
  },
  {
    name: "CategoryService: getById retorna 404 quando nao existe",
    run: getByIdFalhaCom404QuandoNaoExiste,
  },
  {
    name: "CategoryService: getById converte erro desconhecido para 500",
    run: getByIdConverteErroDesconhecidoPara500,
  },
  {
    name: "CategoryService: create retorna categoria criada",
    run: createRetornaCategoriaCriada,
  },
  {
    name: "CategoryService: create propaga AppError",
    run: createPropagaAppError,
  },
  {
    name: "CategoryService: create converte erro desconhecido para 500",
    run: createConverteErroDesconhecidoPara500,
  },
  {
    name: "CategoryService: update retorna categoria atualizada",
    run: updateRetornaCategoriaAtualizada,
  },
  {
    name: "CategoryService: update retorna 404 quando categoria nao existe",
    run: updateRetorna404QuandoCategoriaNaoExiste,
  },
  {
    name: "CategoryService: update retorna 500 quando repositorio nao retorna categoria",
    run: updateRetorna500QuandoRepositorioNaoRetornaCategoria,
  },
  {
    name: "CategoryService: delete mapeia erro de FK para 409",
    run: deleteMapeiaErroDeFKParaConflito,
  },
  {
    name: "CategoryService: delete retorna 404 quando categoria nao existe",
    run: deleteRetorna404QuandoCategoriaNaoExiste,
  },
  {
    name: "CategoryService: delete retorna 500 quando repositorio nao remove",
    run: deleteRetorna500QuandoRepositorioNaoExclui,
  },
  {
    name: "CategoryService: delete converte erro desconhecido para 500",
    run: deleteConverteErroDesconhecidoPara500,
  },
  {
    name: "CategoryService: delete conclui quando repositorio remove",
    run: deleteConcluiQuandoRepositorioExclui,
  },
];
