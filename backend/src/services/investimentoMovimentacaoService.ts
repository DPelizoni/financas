import { AppError } from "../middlewares/errorHandler";
import { InvestimentoAtivoRepository } from "../repositories/investimentoAtivoRepository";
import { InvestimentoMovimentacaoRepository } from "../repositories/investimentoMovimentacaoRepository";
import {
  InvestimentoMovimentacao,
  InvestimentoMovimentacaoFilters,
  InvestimentoMovimentacaoInput,
} from "../models/Investimento";

const normalizeDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
  }

  throw new AppError(400, "Data invalida. Use YYYY-MM-DD ou DD/MM/YYYY");
};

export class InvestimentoMovimentacaoService {
  private movimentacaoRepository = new InvestimentoMovimentacaoRepository();
  private ativoRepository = new InvestimentoAtivoRepository();

  async getAllMovimentacoes(
    filters: InvestimentoMovimentacaoFilters,
  ): Promise<{ movimentacoes: InvestimentoMovimentacao[]; total: number }> {
    return this.movimentacaoRepository.findAll({
      ...filters,
      data_de: filters.data_de ? normalizeDate(filters.data_de) : undefined,
      data_ate: filters.data_ate ? normalizeDate(filters.data_ate) : undefined,
    });
  }

  async getMovimentacaoById(id: number): Promise<InvestimentoMovimentacao> {
    const movimentacao = await this.movimentacaoRepository.findById(id);
    if (!movimentacao) {
      throw new AppError(404, "Movimentacao de investimento nao encontrada");
    }
    return movimentacao;
  }

  async createMovimentacao(
    input: InvestimentoMovimentacaoInput,
  ): Promise<InvestimentoMovimentacao> {
    await this.validateAtivo(input.investimento_ativo_id);
    return this.movimentacaoRepository.create({
      ...input,
      data: normalizeDate(input.data),
    });
  }

  async updateMovimentacao(
    id: number,
    input: Partial<InvestimentoMovimentacaoInput>,
  ): Promise<InvestimentoMovimentacao> {
    const exists = await this.movimentacaoRepository.exists(id);
    if (!exists) {
      throw new AppError(404, "Movimentacao de investimento nao encontrada");
    }

    if (input.investimento_ativo_id !== undefined) {
      await this.validateAtivo(input.investimento_ativo_id);
    }

    const updated = await this.movimentacaoRepository.update(id, {
      ...input,
      data: input.data ? normalizeDate(input.data) : undefined,
    });

    if (!updated) {
      throw new AppError(500, "Erro ao atualizar movimentacao de investimento");
    }

    return updated;
  }

  async deleteMovimentacao(id: number): Promise<void> {
    const exists = await this.movimentacaoRepository.exists(id);
    if (!exists) {
      throw new AppError(404, "Movimentacao de investimento nao encontrada");
    }

    const deleted = await this.movimentacaoRepository.delete(id);
    if (!deleted) {
      throw new AppError(500, "Erro ao excluir movimentacao de investimento");
    }
  }

  private async validateAtivo(ativoId: number): Promise<void> {
    const ativo = await this.ativoRepository.findById(ativoId);
    if (!ativo) {
      throw new AppError(404, "Ativo de investimento nao encontrado");
    }
  }
}
