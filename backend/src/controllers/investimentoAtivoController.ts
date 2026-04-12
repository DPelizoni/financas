import { NextFunction, Request, Response } from "express";
import { paginatedResponse, successResponse } from "../utils/response";
import investimentoAtivoService from "../services/investimentoAtivoService";
import { InvestimentoAtivoFilters } from "../models/Investimento";

export class InvestimentoAtivoController {
  /**
   * @route GET /api/investimentos/ativos/years
   * @desc Obtém os anos disponíveis para os ativos
   */
  async getAvailableYears(req: Request, res: Response, next: NextFunction) {
    try {
      const banco_id = req.query.banco_id
        ? Number(req.query.banco_id)
        : undefined;
      const ativo =
        req.query.ativo === "true"
          ? true
          : req.query.ativo === "false"
            ? false
            : undefined;

      const years = await investimentoAtivoService.getAvailableYears({
        banco_id,
        ativo,
      });

      res.json(successResponse("Anos de ativos listados com sucesso", years));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/investimentos/ativos
   * @desc Lista todos os ativos de investimento com paginação e filtros
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: InvestimentoAtivoFilters = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        search: req.query.search as string | undefined,
        banco_id: req.query.banco_id
          ? Number(req.query.banco_id)
          : undefined,
        ativo:
          req.query.ativo === "true"
            ? true
            : req.query.ativo === "false"
              ? false
              : undefined,
        data_de: req.query.data_de as string | undefined,
        data_ate: req.query.data_ate as string | undefined,
      };

      const { ativos, total } =
        await investimentoAtivoService.getAllAtivos(filters);

      res.json(
        paginatedResponse(
          "Ativos de investimento listados com sucesso",
          ativos,
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
   * @route GET /api/investimentos/ativos/:id
   * @desc Busca ativo de investimento por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const ativo = await investimentoAtivoService.getAtivoById(id);
      res.json(successResponse("Ativo de investimento encontrado", ativo));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/investimentos/ativos
   * @desc Cria um novo ativo de investimento
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const ativo = await investimentoAtivoService.createAtivo(req.body);
      res
        .status(201)
        .json(successResponse("Ativo de investimento criado com sucesso", ativo));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/investimentos/ativos/:id
   * @desc Atualiza um ativo de investimento
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const ativo = await investimentoAtivoService.updateAtivo(id, req.body);
      res.json(successResponse("Ativo de investimento atualizado com sucesso", ativo));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/investimentos/ativos/:id
   * @desc Exclui um ativo de investimento
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await investimentoAtivoService.deleteAtivo(id);
      res.json(successResponse("Ativo de investimento excluido com sucesso"));
    } catch (error) {
      next(error);
    }
  }
}

export default new InvestimentoAtivoController();
