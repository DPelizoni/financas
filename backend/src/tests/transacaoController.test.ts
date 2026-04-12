import assert from "node:assert/strict";
import transacaoController from "../controllers/transacaoController";
import { TransacaoService } from "../services/transacaoService";
import { createMockRequest, createMockResponse, createNextSpy } from "./helpers/httpMocks";
import { TestCase } from "./types";

const servicePrototype = TransacaoService.prototype;

const originalMethods = {
  getAllTransacoes: servicePrototype.getAllTransacoes,
  createTransacao: servicePrototype.createTransacao,
  deleteTransacao: servicePrototype.deleteTransacao,
  copyTransacoesByMes: servicePrototype.copyTransacoesByMes,
  getSummary: servicePrototype.getSummary,
};

const restoreServicePrototype = () => {
  servicePrototype.getAllTransacoes = originalMethods.getAllTransacoes;
  servicePrototype.createTransacao = originalMethods.createTransacao;
  servicePrototype.deleteTransacao = originalMethods.deleteTransacao;
  servicePrototype.copyTransacoesByMes = originalMethods.copyTransacoesByMes;
  servicePrototype.getSummary = originalMethods.getSummary;
};

const getAllParseiaFiltrosERetornaPaginado = async () => {
  try {
    servicePrototype.getAllTransacoes = async (filters) => {
      assert.deepEqual(filters, {
        page: 3,
        limit: 15,
        search: "mercado",
        tipo: "DESPESA",
        categoria_id: 5,
        banco_id: 2,
        situacao: "PAGO",
        mes: "03/2026",
        ano: "2026",
      });
      return {
        transacoes: [{ id: 1, valor: 99.9 }] as Awaited<
          ReturnType<TransacaoService["getAllTransacoes"]>
        >["transacoes"],
        total: 21,
      };
    };

    const req = createMockRequest({
      query: {
        page: "3",
        limit: "15",
        search: "mercado",
        tipo: "DESPESA",
        categoria_id: "5",
        banco_id: "2",
        situacao: "PAGO",
        mes: "03/2026",
        ano: "2026",
      },
    });
    const { res, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await transacaoController.getAll(req, res, next);

    assert.equal(calls.length, 0);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Transações listadas com sucesso",
      data: [{ id: 1, valor: 99.9 }],
      pagination: {
        page: 3,
        limit: 15,
        total: 21,
        totalPages: 2,
      },
    });
  } finally {
    restoreServicePrototype();
  }
};

const createRetorna201 = async () => {
  const payload = {
    mes: "03/2026",
    valor: 100,
  };
  const created = { id: 8, ...payload };

  try {
    servicePrototype.createTransacao = async (data) => {
      assert.deepEqual(data, payload);
      return created as Awaited<ReturnType<TransacaoService["createTransacao"]>>;
    };

    const req = createMockRequest({ body: payload });
    const { res, getStatusCode, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await transacaoController.create(req, res, next);

    assert.equal(calls.length, 0);
    assert.equal(getStatusCode(), 201);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Transação criada com sucesso",
      data: created,
    });
  } finally {
    restoreServicePrototype();
  }
};

const deleteEncaminhaErroParaNext = async () => {
  const expectedError = new Error("falha ao deletar");

  try {
    servicePrototype.deleteTransacao = async () => {
      throw expectedError;
    };

    const req = createMockRequest({
      params: { id: "9" },
    });
    const { res } = createMockResponse();
    const { next, calls } = createNextSpy();

    await transacaoController.delete(req, res, next);

    assert.equal(calls.length, 1);
    assert.equal(calls[0], expectedError);
  } finally {
    restoreServicePrototype();
  }
};

const copyByMonthRetorna201 = async () => {
  const response = {
    mes_origem: "03/2026",
    meses_destino: ["04/2026"],
    total_origem: 2,
    total_criadas: 2,
  };

  try {
    servicePrototype.copyTransacoesByMes = async (mesOrigem, mesesDestino) => {
      assert.equal(mesOrigem, "03/2026");
      assert.deepEqual(mesesDestino, ["04/2026"]);
      return response as Awaited<
        ReturnType<TransacaoService["copyTransacoesByMes"]>
      >;
    };

    const req = createMockRequest({
      body: {
        mes_origem: "03/2026",
        meses_destino: ["04/2026"],
      },
    });
    const { res, getStatusCode, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await transacaoController.copyByMonth(req, res, next);

    assert.equal(calls.length, 0);
    assert.equal(getStatusCode(), 201);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Transações copiadas com sucesso",
      data: response,
    });
  } finally {
    restoreServicePrototype();
  }
};

const getSummaryRetornaPayload = async () => {
  const summary = {
    total_pago: 100,
    total_pendente: 50,
    total_registros: 4,
  };

  try {
    servicePrototype.getSummary = async (filters) => {
      assert.deepEqual(filters, {
        search: undefined,
        tipo: "RECEITA",
        categoria_id: undefined,
        banco_id: undefined,
        situacao: "PENDENTE",
        mes: undefined,
        ano: "2026",
      });
      return summary as Awaited<ReturnType<TransacaoService["getSummary"]>>;
    };

    const req = createMockRequest({
      query: {
        tipo: "RECEITA",
        situacao: "PENDENTE",
        ano: "2026",
      },
    });
    const { res, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await transacaoController.getSummary(req, res, next);

    assert.equal(calls.length, 0);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Resumo",
      data: summary,
    });
  } finally {
    restoreServicePrototype();
  }
};

export const transacaoControllerTests: TestCase[] = [
  {
    name: "TransacaoController: getAll parseia filtros e retorna paginado",
    run: getAllParseiaFiltrosERetornaPaginado,
  },
  {
    name: "TransacaoController: create retorna 201 com payload",
    run: createRetorna201,
  },
  {
    name: "TransacaoController: delete encaminha erro para next",
    run: deleteEncaminhaErroParaNext,
  },
  {
    name: "TransacaoController: copyByMonth retorna 201",
    run: copyByMonthRetorna201,
  },
  {
    name: "TransacaoController: getSummary retorna payload",
    run: getSummaryRetornaPayload,
  },
];
