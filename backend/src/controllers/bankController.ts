import { Request, Response, NextFunction } from "express";
import bankService from "../services/bankService";
import { successResponse, paginatedResponse } from "../utils/response";
import { BankFilters } from "../models/Bank";

export class BankController {
  /**
   * @route GET /api/banks
   * @desc Lista todos os bancos com paginação e filtros
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: BankFilters = {
        search: req.query.search as string,
        ativo:
          req.query.ativo === "true"
            ? true
            : req.query.ativo === "false"
              ? false
              : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const { banks, total } = await bankService.getAllBanks(filters);

      res.json(
        paginatedResponse(
          "Bancos listados com sucesso",
          banks,
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
   * @route GET /api/banks/:id
   * @desc Busca banco por ID
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const bank = await bankService.getBankById(id);
      res.json(successResponse("Banco encontrado", bank));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/banks
   * @desc Cria novo banco
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bank = await bankService.createBank(req.body);
      res.status(201).json(successResponse("Banco criado com sucesso", bank));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/banks/:id
   * @desc Atualiza banco
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const bank = await bankService.updateBank(id, req.body);
      res.json(successResponse("Banco atualizado com sucesso", bank));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/banks/:id
   * @desc Exclui banco
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await bankService.deleteBank(id);
      res.json(successResponse("Banco excluído com sucesso"));
    } catch (error) {
      next(error);
    }
  }
}

export default new BankController();
