import { AppError } from "../middlewares/errorHandler";
import { BankRepository } from "../repositories/bankRepository";
import { InvestimentoAtivoRepository } from "../repositories/investimentoAtivoRepository";
import {
  InvestimentoAtivo,
  InvestimentoAtivoFilters,
  InvestimentoAtivoInput,
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

export class InvestimentoAtivoService {
  private ativoRepository = new InvestimentoAtivoRepository();
  private bankRepository = new BankRepository();

  async getAllAtivos(
    filters: InvestimentoAtivoFilters,
  ): Promise<{ ativos: InvestimentoAtivo[]; total: number }> {
    return this.ativoRepository.findAll({
      ...filters,
      data_de: filters.data_de ? normalizeDate(filters.data_de) : undefined,
      data_ate: filters.data_ate ? normalizeDate(filters.data_ate) : undefined,
    });
  }

  async getAvailableYears(filters: {
    banco_id?: number;
    ativo?: boolean;
  }): Promise<string[]> {
    return this.ativoRepository.getAvailableYears(filters);
  }

  async getAtivoById(id: number): Promise<InvestimentoAtivo> {
    const ativo = await this.ativoRepository.findById(id);
    if (!ativo) {
      throw new AppError(404, "Ativo de investimento nao encontrado");
    }
    return ativo;
  }

  async createAtivo(input: InvestimentoAtivoInput): Promise<InvestimentoAtivo> {
    await this.validateBank(input.banco_id);
    return this.ativoRepository.create({
      ...input,
      data_saldo_inicial: normalizeDate(input.data_saldo_inicial),
    });
  }

  async updateAtivo(
    id: number,
    input: Partial<InvestimentoAtivoInput>,
  ): Promise<InvestimentoAtivo> {
    const exists = await this.ativoRepository.exists(id);
    if (!exists) {
      throw new AppError(404, "Ativo de investimento nao encontrado");
    }

    if (input.banco_id !== undefined) {
      await this.validateBank(input.banco_id);
    }

    const updated = await this.ativoRepository.update(id, {
      ...input,
      data_saldo_inicial: input.data_saldo_inicial
        ? normalizeDate(input.data_saldo_inicial)
        : undefined,
    });

    if (!updated) {
      throw new AppError(500, "Erro ao atualizar ativo de investimento");
    }

    return updated;
  }

  async deleteAtivo(id: number): Promise<void> {
    const exists = await this.ativoRepository.exists(id);
    if (!exists) {
      throw new AppError(404, "Ativo de investimento nao encontrado");
    }

    try {
      const deleted = await this.ativoRepository.delete(id);
      if (!deleted) {
        throw new AppError(500, "Erro ao excluir ativo de investimento");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;

      const dbError = error as { code?: string; message?: string };
      if (
        dbError.code === "ER_ROW_IS_REFERENCED_2" ||
        dbError.code === "ER_ROW_IS_REFERENCED" ||
        dbError.message?.toLowerCase().includes("foreign key")
      ) {
        throw new AppError(
          409,
          "Nao e possivel excluir este ativo porque ele possui movimentacoes vinculadas.",
        );
      }

      throw new AppError(500, "Erro ao excluir ativo de investimento");
    }
  }

  private async validateBank(bancoId: number): Promise<void> {
    const bank = await this.bankRepository.findById(bancoId);
    if (!bank) {
      throw new AppError(404, "Banco nao encontrado");
    }
  }
}
