import assert from "node:assert/strict";
import { Response } from "express";
import descricaoController from "../controllers/descricaoController";
import descricaoService from "../services/descricaoService";
import { createMockRequest, createMockResponse } from "./helpers/httpMocks";
import { TestCase } from "./types";

const originalDescricaoServiceMethods = {
  getAllDescricoes: descricaoService.getAllDescricoes,
  getDescricaoById: descricaoService.getDescricaoById,
  deleteDescricao: descricaoService.deleteDescricao,
};

const restoreDescricaoService = () => {
  descricaoService.getAllDescricoes = originalDescricaoServiceMethods.getAllDescricoes;
  descricaoService.getDescricaoById = originalDescricaoServiceMethods.getDescricaoById;
  descricaoService.deleteDescricao = originalDescricaoServiceMethods.deleteDescricao;
};

const getAllParseiaFiltros = async () => {
  try {
    descricaoService.getAllDescricoes = async (filters) => {
      assert.deepEqual(filters, {
        page: 2,
        limit: 25,
        search: "assi",
        ativo: false,
        categoria_id: 7,
      });
      return {
        descricoes: [
          {
            id: 1,
            nome: "Assinatura",
            categoria_id: 7,
            ativo: true,
            created_at: new Date("2026-01-01T00:00:00.000Z"),
            updated_at: new Date("2026-01-01T00:00:00.000Z"),
          },
        ],
        total: 55,
      };
    };

    const req = createMockRequest({
      query: {
        page: "2",
        limit: "25",
        search: "assi",
        ativo: "false",
        categoria_id: "7",
      },
    });
    const { res, getJsonBody } = createMockResponse();

    await descricaoController.getAll(req, res, () => {});

    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Descrições listadas com sucesso",
      data: [
        {
          id: 1,
          nome: "Assinatura",
          categoria_id: 7,
          ativo: true,
          created_at: new Date("2026-01-01T00:00:00.000Z"),
          updated_at: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
      pagination: {
        page: 2,
        limit: 25,
        total: 55,
        totalPages: 3,
      },
    });
  } finally {
    restoreDescricaoService();
  }
};

const getByIdRetornaPayloadDoService = async () => {
  try {
    descricaoService.getDescricaoById = async (id: number) => {
      assert.equal(id, 18);
      return {
        id: 18,
        nome: "Internet",
        categoria_id: 3,
        ativo: true,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
      };
    };

    const req = createMockRequest({
      params: { id: "18" },
    });
    const { res, getJsonBody } = createMockResponse();

    await descricaoController.getById(req, res, () => {});

    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Descrição encontrada",
      data: {
        id: 18,
        nome: "Internet",
        categoria_id: 3,
        ativo: true,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
  } finally {
    restoreDescricaoService();
  }
};

const deleteRetornaSucesso = async () => {
  let calledId = 0;

  try {
    descricaoService.deleteDescricao = async (id: number) => {
      calledId = id;
    };

    const req = createMockRequest({
      params: { id: "14" },
    });
    const { res, getJsonBody } = createMockResponse();

    await descricaoController.delete(req, res, () => {});

    assert.equal(calledId, 14);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Descrição excluída com sucesso",
      data: undefined,
    });
  } finally {
    restoreDescricaoService();
  }
};

export const descricaoControllerTests: TestCase[] = [
  {
    name: "DescricaoController: getAll parseia filtros e retorna paginado",
    run: getAllParseiaFiltros,
  },
  {
    name: "DescricaoController: getById retorna payload do service",
    run: getByIdRetornaPayloadDoService,
  },
  {
    name: "DescricaoController: delete retorna sucesso",
    run: deleteRetornaSucesso,
  },
];
