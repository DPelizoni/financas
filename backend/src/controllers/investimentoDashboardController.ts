import { NextFunction, Request, Response } from "express";
import { successResponse } from "../utils/response";
import { InvestimentoDashboardService } from "../services/investimentoDashboardService";

const investimentoDashboardService = new InvestimentoDashboardService();

export const investimentoDashboardController = {
  getAvailableYears: async (req: Request, res: Response, next: NextFunction) => {
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
  },

  getDashboard: async (req: Request, res: Response, next: NextFunction) => {
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
  },
};
