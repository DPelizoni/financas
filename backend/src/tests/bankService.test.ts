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
  findById: bankRepository.findById,
  exists: bankRepository.exists,
  delete: bankRepository.delete,
};

const restoreRepository = () => {
  bankRepository.findById = originalRepositoryMethods.findById;
  bankRepository.exists = originalRepositoryMethods.exists;
  bankRepository.delete = originalRepositoryMethods.delete;
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

const updateFalhaQuandoBancoNaoExiste = async () => {
  try {
    bankRepository.exists = async () => false;

    await assert.rejects(
      async () => bankService.updateBank(99, { nome: "Atualizado" }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        assert.match(error.message, /banco n[oã]o encontrado/i);
        return true;
      },
    );
  } finally {
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
        assert.match(error.message, /n[oã]o [ée] poss[íi]vel excluir este banco/i);
        return true;
      },
    );
  } finally {
    restoreRepository();
  }
};

export const bankServiceTests: TestCase[] = [
  {
    name: "BankService: getById retorna banco quando existe",
    run: getByIdRetornaBancoQuandoExiste,
  },
  {
    name: "BankService: update falha quando banco nao existe",
    run: updateFalhaQuandoBancoNaoExiste,
  },
  {
    name: "BankService: delete mapeia erro de FK para 409",
    run: deleteMapeiaErroDeFKParaConflito,
  },
];

