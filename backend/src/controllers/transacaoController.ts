import { NextFunction, Request, Response } from "express";
import transacaoService from "../services/transacaoService";
import { paginatedResponse, successResponse } from "../utils/response";

export class TransacaoController {
  /**
   * @route GET /api/transacoes
   * @desc Lista todas as transações com paginação e filtros
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/transacoes/:id
   * @desc Busca transação por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const transacao = await transacaoService.getById(id);
      res.json(successResponse("Transação encontrada", transacao));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/transacoes
   * @desc Cria uma nova transação
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const transacao = await transacaoService.createTransacao(data);
      res.status(201).json(successResponse("Transação criada com sucesso", transacao));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/transacoes/batch
   * @desc Cria múltiplas transações em lote
   */
  async createBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { transacoes } = req.body;
      const result = await transacaoService.createTransacoesBatch(transacoes);

      res
        .status(201)
        .json(successResponse("Transações criadas com sucesso", result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route PUT /api/transacoes/:id
   * @desc Atualiza uma transação
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = req.body;
      const transacao = await transacaoService.updateTransacao(id, data);
      res.json(successResponse("Transação atualizada com sucesso", transacao));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/transacoes/:id
   * @desc Exclui uma transação
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await transacaoService.deleteTransacao(id);
      res.json(successResponse("Transação deletada com sucesso", null));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/transacoes/summary
   * @desc Obtém resumo financeiro
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/transacoes/copy-month
   * @desc Copia transações de um mês para outros
   */
  async copyByMonth(req: Request, res: Response, next: NextFunction) {
    try {
      const { mes_origem, meses_destino } = req.body;
      const result = await transacaoService.copyTransacoesByMes(
        mes_origem,
        meses_destino,
      );

      res
        .status(201)
        .json(successResponse("Transações copiadas com sucesso", result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/transacoes/delete-months
   * @desc Exclui transações de múltiplos meses
   */
  async deleteByMonths(req: Request, res: Response, next: NextFunction) {
    try {
      const { meses } = req.body;
      const result = await transacaoService.deleteTransacoesByMeses(meses);

      res.json(successResponse("Transações excluídas com sucesso", result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route DELETE /api/transacoes/delete-transaction-months
   * @desc Exclui uma transação específica em múltiplos meses
   */
  async deleteTransactionByMeses(req: Request, res: Response, next: NextFunction) {
    try {
      const { transacao_id, meses } = req.body;
      const result = await transacaoService.deleteTransacaoByMeses(
        Number(transacao_id),
        meses,
      );

      res.json(
        successResponse("Transação excluída nos meses selecionados", result),
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new TransacaoController();
