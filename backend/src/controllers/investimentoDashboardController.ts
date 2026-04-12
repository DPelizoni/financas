import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import investimentoDashboardService from "../services/investimentoDashboardService";

export class InvestimentoDashboardController {
  /**
   * @route GET /api/investimentos/dashboard/years
   * @desc Obtém os anos disponíveis para o dashboard
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

      const years = await investimentoDashboardService.getAvailableYears({
        banco_id,
        ativo,
      });

      res.json(successResponse("Anos de movimentações listados com sucesso", years));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/investimentos/dashboard
   * @desc Obtém os dados consolidados do dashboard de investimentos
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
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
      const data_de = req.query.data_de as string | undefined;
      const data_ate = req.query.data_ate as string | undefined;

      const dashboard = await investimentoDashboardService.getDashboard({
        banco_id,
        ativo,
        data_de,
        data_ate,
      });

      res.json(successResponse("Dashboard de investimentos", dashboard));
    } catch (error) {
      next(error);
    }
  }
}

export default new InvestimentoDashboardController();
