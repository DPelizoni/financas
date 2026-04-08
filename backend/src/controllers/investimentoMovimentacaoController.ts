import { NextFunction, Request, Response } from "express";
import { paginatedResponse, successResponse } from "../utils/response";
import { InvestimentoMovimentacaoService } from "../services/investimentoMovimentacaoService";
import {
  InvestimentoMovimentacaoFilters,
  InvestimentoMovimentacaoTipo,
} from "../models/Investimento";

const investimentoMovimentacaoService = new InvestimentoMovimentacaoService();

export const investimentoMovimentacaoController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tipoQuery = req.query.tipo as string | undefined;
      const tipo: InvestimentoMovimentacaoTipo | undefined =
        tipoQuery === "APORTE" ||
        tipoQuery === "RESGATE" ||
        tipoQuery === "RENDIMENTO"
          ? tipoQuery
          : undefined;

      const filters: InvestimentoMovimentacaoFilters = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        search: req.query.search as string | undefined,
        investimento_ativo_id: req.query.investimento_ativo_id
          ? Number(req.query.investimento_ativo_id)
          : undefined,
        banco_id: req.query.banco_id
          ? Number(req.query.banco_id)
          : undefined,
        ativo:
          req.query.ativo === "true"
            ? true
            : req.query.ativo === "false"
              ? false
              : undefined,
        tipo,
        data_de: req.query.data_de as string | undefined,
        data_ate: req.query.data_ate as string | undefined,
      };

      const { movimentacoes, total } =
        await investimentoMovimentacaoService.getAllMovimentacoes(filters);

      res.json(
        paginatedResponse(
          "Movimentacoes de investimento listadas com sucesso",
          movimentacoes,
          filters.page!,
          filters.limit!,
          total,
        ),
      );
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const movimentacao =
        await investimentoMovimentacaoService.getMovimentacaoById(id);
      res.json(
        successResponse("Movimentacao de investimento encontrada", movimentacao),
      );
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const movimentacao =
        await investimentoMovimentacaoService.createMovimentacao(req.body);
      res
        .status(201)
        .json(
          successResponse(
            "Movimentacao de investimento criada com sucesso",
            movimentacao,
          ),
        );
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const movimentacao =
        await investimentoMovimentacaoService.updateMovimentacao(id, req.body);
      res.json(
        successResponse(
          "Movimentacao de investimento atualizada com sucesso",
          movimentacao,
        ),
      );
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      await investimentoMovimentacaoService.deleteMovimentacao(id);
      res.json(successResponse("Movimentacao de investimento excluida com sucesso"));
    } catch (error) {
      next(error);
    }
  },
};
