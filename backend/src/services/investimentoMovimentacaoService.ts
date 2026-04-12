import { AppError } from "../middlewares/errorHandler";
import ativoRepository from "../repositories/investimentoAtivoRepository";
import movimentacaoRepository from "../repositories/investimentoMovimentacaoRepository";
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
  /**
   * Lista todas as movimentações de investimento com filtros
   */
  async getAllMovimentacoes(
    filters: InvestimentoMovimentacaoFilters,
  ): Promise<{ movimentacoes: InvestimentoMovimentacao[]; total: number }> {
    return movimentacaoRepository.findAll({
      ...filters,
      data_de: filters.data_de ? normalizeDate(filters.data_de) : undefined,
      data_ate: filters.data_ate ? normalizeDate(filters.data_ate) : undefined,
    });
  }

  /**
   * Busca uma movimentação de investimento por ID
   */
  async getMovimentacaoById(id: number): Promise<InvestimentoMovimentacao> {
    const movimentacao = await movimentacaoRepository.findById(id);
    if (!movimentacao) {
      throw new AppError(404, "Movimentacao de investimento nao encontrada");
    }
    return movimentacao;
  }

  /**
   * Cria uma nova movimentação de investimento
   */
  async createMovimentacao(
    input: InvestimentoMovimentacaoInput,
  ): Promise<InvestimentoMovimentacao> {
    await this.validateAtivo(input.investimento_ativo_id);
    return movimentacaoRepository.create({
      ...input,
      data: normalizeDate(input.data),
    });
  }

  /**
   * Atualiza uma movimentação de investimento
   */
  async updateMovimentacao(
    id: number,
    input: Partial<InvestimentoMovimentacaoInput>,
  ): Promise<InvestimentoMovimentacao> {
    const exists = await movimentacaoRepository.exists(id);
    if (!exists) {
      throw new AppError(404, "Movimentacao de investimento nao encontrada");
    }

    if (input.investimento_ativo_id !== undefined) {
      await this.validateAtivo(input.investimento_ativo_id);
    }

    const updated = await movimentacaoRepository.update(id, {
      ...input,
      data: input.data ? normalizeDate(input.data) : undefined,
    });

    if (!updated) {
      throw new AppError(500, "Erro ao atualizar movimentacao de investimento");
    }

    return updated;
  }

  /**
   * Exclui uma movimentação de investimento
   */
  async deleteMovimentacao(id: number): Promise<void> {
    const exists = await movimentacaoRepository.exists(id);
    if (!exists) {
      throw new AppError(404, "Movimentacao de investimento nao encontrada");
    }

    const deleted = await movimentacaoRepository.delete(id);
    if (!deleted) {
      throw new AppError(500, "Erro ao excluir movimentacao de investimento");
    }
  }

  /**
   * Valida se o ativo de investimento existe
   */
  private async validateAtivo(ativoId: number): Promise<void> {
    const ativo = await ativoRepository.findById(ativoId);
    if (!ativo) {
      throw new AppError(404, "Ativo de investimento nao encontrado");
    }
  }
}

export default new InvestimentoMovimentacaoService();
