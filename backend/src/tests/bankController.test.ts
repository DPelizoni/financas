import assert from "node:assert/strict";
import bankController from "../controllers/bankController";
import bankService from "../services/bankService";
import {
  createMockRequest,
  createMockResponse,
  createNextSpy,
} from "./helpers/httpMocks";
import { TestCase } from "./types";

const originalBankServiceMethods = {
  getAllBanks: bankService.getAllBanks,
  createBank: bankService.createBank,
  deleteBank: bankService.deleteBank,
};

const restoreBankService = () => {
  bankService.getAllBanks = originalBankServiceMethods.getAllBanks;
  bankService.createBank = originalBankServiceMethods.createBank;
  bankService.deleteBank = originalBankServiceMethods.deleteBank;
};

const listParseiaFiltrosERetornaPaginado = async () => {
  try {
    bankService.getAllBanks = async (filters) => {
      assert.deepEqual(filters, {
        search: "itau",
        ativo: false,
        page: 2,
        limit: 15,
      });
      return {
        banks: [{ id: 1, nome: "Itaú" }] as Awaited<
          ReturnType<typeof bankService.getAllBanks>
        >["banks"],
        total: 20,
      };
    };

    const req = createMockRequest({
      query: {
        search: "itau",
        ativo: "false",
        page: "2",
        limit: "15",
      },
    });
    const { res, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await bankController.list(req, res, next);

    assert.equal(calls.length, 0);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Bancos listados com sucesso",
      data: [{ id: 1, nome: "Itaú" }],
      pagination: {
        page: 2,
        limit: 15,
        total: 20,
        totalPages: 2,
      },
    });
  } finally {
    restoreBankService();
  }
};

const createRetorna201QuandoSucesso = async () => {
  const payload = {
    nome: "Banco XP",
    cor: "#123456",
    saldo_inicial: 10,
  };
  const created = {
    id: 4,
    ...payload,
    ativo: true,
  };

  try {
    bankService.createBank = async (input) => {
      assert.deepEqual(input, payload);
      return created as Awaited<ReturnType<typeof bankService.createBank>>;
    };

    const req = createMockRequest({ body: payload });
    const { res, getStatusCode, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await bankController.create(req, res, next);

    assert.equal(calls.length, 0);
    assert.equal(getStatusCode(), 201);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Banco criado com sucesso",
      data: created,
    });
  } finally {
    restoreBankService();
  }
};

const deleteEncaminhaErroParaNext = async () => {
  const expectedError = new Error("falha ao excluir banco");

  try {
    bankService.deleteBank = async () => {
      throw expectedError;
    };

    const req = createMockRequest({
      params: { id: "9" },
    });
    const { res } = createMockResponse();
    const { next, calls } = createNextSpy();

    await bankController.delete(req, res, next);

    assert.equal(calls.length, 1);
    assert.equal(calls[0], expectedError);
  } finally {
    restoreBankService();
  }
};

export const bankControllerTests: TestCase[] = [
  {
    name: "BankController: list parseia filtros e retorna paginado",
    run: listParseiaFiltrosERetornaPaginado,
  },
  {
    name: "BankController: create retorna 201 quando sucesso",
    run: createRetorna201QuandoSucesso,
  },
  {
    name: "BankController: delete encaminha erro para next",
    run: deleteEncaminhaErroParaNext,
  },
];

