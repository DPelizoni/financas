import { NextFunction, Request, Response } from "express";
import descricaoService from "../services/descricaoService";
import { paginatedResponse, successResponse } from "../utils/response";
import { DescricaoFilters } from "../models/Descricao";

export class DescricaoController {
  /**
   * @route GET /api/descricoes
   * @desc Lista todas as descrições com paginação e filtros
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search ? String(req.query.search) : undefined;
      const ativo = req.query.ativo ? req.query.ativo === "true" : undefined;
      const categoria_id = req.query.categoria_id
        ? Number(req.query.categoria_id)
        : undefined;

      const filters: DescricaoFilters = {
        page,
        limit,
        search,
        ativo,
        categoria_id,
      };

      const { descricoes, total } =
        await descricaoService.getAllDescricoes(filters);

      res.json(
        paginatedResponse(
          "Descrições listadas com sucesso",
          descricoes,
          page,
          limit,
          total,
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/descricoes/:id
   * @desc Busca descrição por ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const descricao = await descricaoService.getDescricaoById(Number(id));
      res.json(successResponse("Descrição encontrada", descricao));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/descricoes
   * @desc Cria uma nova descrição
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const descricao = await descricaoService.createDescricao(req.body);
      res.status(201).json(successResponse("Descrição criada com sucesso", descricao));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/descricoes/:id
   * @desc Atualiza uma descrição
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const descricao = await descricaoService.updateDescricao(
        Number(id),
        req.body,
      );
      res.json(successResponse("Descrição atualizada com sucesso", descricao));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/descricoes/:id
   * @desc Exclui uma descrição
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await descricaoService.deleteDescricao(Number(id));
      res.json(successResponse("Descrição excluída com sucesso"));
    } catch (error) {
      next(error);
    }
  }
}

export default new DescricaoController();
