import { Request, Response } from "express";
import { TransacaoService } from "../services/transacaoService";
import { paginatedResponse, successResponse } from "../utils/response";

const transacaoService = new TransacaoService();

export const transacaoController = {
  getAll: async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const tipo = req.query.tipo as "DESPESA" | "RECEITA" | undefined;
    const categoria_id = req.query.categoria_id
      ? Number(req.query.categoria_id)
      : undefined;
    const banco_id = req.query.banco_id
      ? Number(req.query.banco_id)
      : undefined;
    const situacao = req.query.situacao as "PENDENTE" | "PAGO" | undefined;
    const mes = req.query.mes as string | undefined;
    const ano = req.query.ano as string | undefined;

    const filters = {
      page,
      limit,
      search,
      tipo,
      categoria_id,
      banco_id,
      situacao,
      mes,
      ano,
    };

    const { transacoes, total } =
      await transacaoService.getAllTransacoes(filters);

    res.json(
      paginatedResponse(
        "Transações listadas com sucesso",
        transacoes,
        page,
        limit,
        total,
      ),
    );
  },

  getById: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const transacao = await transacaoService.getById(id);
    res.json(successResponse("Transação encontrada", transacao));
  },

  create: async (req: Request, res: Response) => {
    const data = req.body;
    const transacao = await transacaoService.createTransacao(data);
    res
      .status(201)
      .json(successResponse("Transação criada com sucesso", transacao));
  },

  update: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = req.body;
    const transacao = await transacaoService.updateTransacao(id, data);
    res.json(successResponse("Transação atualizada com sucesso", transacao));
  },

  delete: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await transacaoService.deleteTransacao(id);
    res.json(successResponse("Transação deletada com sucesso", null));
  },

  getSummary: async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const tipo = req.query.tipo as "DESPESA" | "RECEITA" | undefined;
    const categoria_id = req.query.categoria_id
      ? Number(req.query.categoria_id)
      : undefined;
    const banco_id = req.query.banco_id
      ? Number(req.query.banco_id)
      : undefined;
    const situacao = req.query.situacao as "PENDENTE" | "PAGO" | undefined;
    const mes = req.query.mes as string | undefined;
    const ano = req.query.ano as string | undefined;

    const summary = await transacaoService.getSummary({
      search,
      tipo,
      categoria_id,
      banco_id,
      situacao,
      mes,
      ano,
    });
    res.json(successResponse("Resumo", summary));
  },

  copyByMonth: async (req: Request, res: Response) => {
    const { mes_origem, meses_destino } = req.body;
    const result = await transacaoService.copyTransacoesByMes(
      mes_origem,
      meses_destino,
    );

    res
      .status(201)
      .json(successResponse("Transações copiadas com sucesso", result));
  },

  deleteByMonths: async (req: Request, res: Response) => {
    const { meses } = req.body;
    const result = await transacaoService.deleteTransacoesByMeses(meses);

    res.json(successResponse("Transações excluídas com sucesso", result));
  },
};
