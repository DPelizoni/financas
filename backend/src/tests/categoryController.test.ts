import assert from "node:assert/strict";
import categoryController from "../controllers/categoryController";
import categoryService from "../services/categoryService";
import {
  createMockRequest,
  createMockResponse,
  createNextSpy,
} from "./helpers/httpMocks";
import { TestCase } from "./types";

const originalCategoryServiceMethods = {
  getAllCategories: categoryService.getAllCategories,
  updateCategory: categoryService.updateCategory,
};

const restoreCategoryService = () => {
  categoryService.getAllCategories = originalCategoryServiceMethods.getAllCategories;
  categoryService.updateCategory = originalCategoryServiceMethods.updateCategory;
};

const listParseiaTipoEStatus = async () => {
  try {
    categoryService.getAllCategories = async (filters) => {
      assert.deepEqual(filters, {
        search: "mercado",
        ativo: true,
        tipo: "DESPESA",
        page: 3,
        limit: 5,
      });
      return {
        categories: [{ id: 1, nome: "Alimentação" }] as Awaited<
          ReturnType<typeof categoryService.getAllCategories>
        >["categories"],
        total: 8,
      };
    };

    const req = createMockRequest({
      query: {
        search: "mercado",
        ativo: "true",
        tipo: "DESPESA",
        page: "3",
        limit: "5",
      },
    });
    const { res, getJsonBody } = createMockResponse();
    const { next, calls } = createNextSpy();

    await categoryController.list(req, res, next);

    assert.equal(calls.length, 0);
    assert.deepEqual(getJsonBody(), {
      success: true,
      message: "Categorias listadas com sucesso",
      data: [{ id: 1, nome: "Alimentação" }],
      pagination: {
        page: 3,
        limit: 5,
        total: 8,
        totalPages: 2,
      },
    });
  } finally {
    restoreCategoryService();
  }
};

const updateEncaminhaErroParaNext = async () => {
  const expectedError = new Error("falha ao atualizar categoria");

  try {
    categoryService.updateCategory = async () => {
      throw expectedError;
    };

    const req = createMockRequest({
      params: { id: "11" },
      body: { nome: "Nova" },
    });
    const { res } = createMockResponse();
    const { next, calls } = createNextSpy();

    await categoryController.update(req, res, next);

    assert.equal(calls.length, 1);
    assert.equal(calls[0], expectedError);
  } finally {
    restoreCategoryService();
  }
};

export const categoryControllerTests: TestCase[] = [
  {
    name: "CategoryController: list parseia filtros com tipo e ativo",
    run: listParseiaTipoEStatus,
  },
  {
    name: "CategoryController: update encaminha erro para next",
    run: updateEncaminhaErroParaNext,
  },
];

