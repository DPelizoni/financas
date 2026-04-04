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
  exists: descricaoRepository.exists,
  create: descricaoRepository.create,
  update: descricaoRepository.update,
  delete: descricaoRepository.delete,
};

const originalCategoryRepositoryMethods = {
  exists: categoryRepository.exists,
};

const restoreRepositories = () => {
  descricaoRepository.exists = originalDescricaoRepositoryMethods.exists;
  descricaoRepository.create = originalDescricaoRepositoryMethods.create;
  descricaoRepository.update = originalDescricaoRepositoryMethods.update;
  descricaoRepository.delete = originalDescricaoRepositoryMethods.delete;
  categoryRepository.exists = originalCategoryRepositoryMethods.exists;
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
        assert.match(error.message, /categoria n[oã]o encontrada/i);
        return true;
      },
    );
  } finally {
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
        assert.match(error.message, /categoria n[oã]o encontrada/i);
        return true;
      },
    );
  } finally {
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
        assert.match(error.message, /n[oã]o [ée] poss[íi]vel excluir esta descri[çc][ãa]o/i);
        return true;
      },
    );
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
    name: "DescricaoService: create falha quando categoria nao existe",
    run: createFalhaQuandoCategoriaNaoExiste,
  },
  {
    name: "DescricaoService: update valida categoria quando informada",
    run: updateValidaCategoriaQuandoInformada,
  },
  {
    name: "DescricaoService: delete mapeia erro de FK para 409",
    run: deleteMapeiaErroDeFKParaConflito,
  },
  {
    name: "DescricaoService: create persiste quando categoria existe",
    run: createComCategoriaValidaPersisteRegistro,
  },
];

