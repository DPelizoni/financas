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
  findById: categoryRepository.findById,
  exists: categoryRepository.exists,
  update: categoryRepository.update,
  delete: categoryRepository.delete,
};

const restoreRepository = () => {
  categoryRepository.findById = originalRepositoryMethods.findById;
  categoryRepository.exists = originalRepositoryMethods.exists;
  categoryRepository.update = originalRepositoryMethods.update;
  categoryRepository.delete = originalRepositoryMethods.delete;
};

const getByIdFalhaCom404QuandoNaoExiste = async () => {
  try {
    categoryRepository.findById = async () => null;

    await assert.rejects(
      async () => categoryService.getCategoryById(10),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /categoria n[oã]o encontrada/i);
        return true;
      },
    );
  } finally {
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

export const categoryServiceTests: TestCase[] = [
  {
    name: "CategoryService: getById retorna 404 quando nao existe",
    run: getByIdFalhaCom404QuandoNaoExiste,
  },
  {
    name: "CategoryService: update retorna categoria atualizada",
    run: updateRetornaCategoriaAtualizada,
  },
  {
    name: "CategoryService: delete mapeia erro de FK para 409",
    run: deleteMapeiaErroDeFKParaConflito,
  },
];
