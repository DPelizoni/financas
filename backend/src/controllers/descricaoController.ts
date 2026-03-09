import { Request, Response } from "express";
import descricaoService from "../services/descricaoService";
import { paginatedResponse } from "../utils/response";
import { DescricaoFilters } from "../models/Descricao";

export const descricaoController = {
  async getAll(req: Request, res: Response): Promise<void> {
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
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const descricao = await descricaoService.getDescricaoById(Number(id));
    res.json(descricao);
  },

  async create(req: Request, res: Response): Promise<void> {
    const descricao = await descricaoService.createDescricao(req.body);
    res.status(201).json(descricao);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const descricao = await descricaoService.updateDescricao(
      Number(id),
      req.body,
    );
    res.json(descricao);
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await descricaoService.deleteDescricao(Number(id));
    res.sendStatus(200);
  },
};
