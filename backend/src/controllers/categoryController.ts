import { Request, Response, NextFunction } from "express";
import categoryService from "../services/categoryService";
import { successResponse, paginatedResponse } from "../utils/response";
import { CategoryFilters } from "../models/Category";

export class CategoryController {
  /**
   * @route GET /api/categories
   * @desc Lista todas as categorias com paginação e filtros
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: CategoryFilters = {
        search: req.query.search as string,
        ativo:
          req.query.ativo === "true"
            ? true
            : req.query.ativo === "false"
              ? false
              : undefined,
        tipo:
          req.query.tipo === "RECEITA" || req.query.tipo === "DESPESA"
            ? (req.query.tipo as "RECEITA" | "DESPESA")
            : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const { categories, total } =
        await categoryService.getAllCategories(filters);

      res.json(
        paginatedResponse(
          "Categorias listadas com sucesso",
          categories,
          filters.page!,
          filters.limit!,
          total,
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/categories/:id
   * @desc Busca categoria por ID
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const category = await categoryService.getCategoryById(id);
      res.json(successResponse("Categoria encontrada", category));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/categories
   * @desc Cria uma nova categoria
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.createCategory(req.body);
      res
        .status(201)
        .json(successResponse("Categoria criada com sucesso", category));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/categories/:id
   * @desc Atualiza uma categoria
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const category = await categoryService.updateCategory(id, req.body);
      res.json(successResponse("Categoria atualizada com sucesso", category));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/categories/:id
   * @desc Exclui uma categoria
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await categoryService.deleteCategory(id);
      res.json(successResponse("Categoria excluída com sucesso"));
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
