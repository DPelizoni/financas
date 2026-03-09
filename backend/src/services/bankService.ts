import bankRepository from "../repositories/bankRepository";
import { Bank, BankInput, BankFilters } from "../models/Bank";
import { AppError } from "../middlewares/errorHandler";

export class BankService {
  /**
   * Lista bancos com paginação e filtros
   */
  async getAllBanks(
    filters: BankFilters,
  ): Promise<{ banks: Bank[]; total: number }> {
    try {
      return await bankRepository.findAll(filters);
    } catch (error) {
      console.error("Erro ao listar bancos:", error);
      throw new AppError(500, "Erro ao listar bancos");
    }
  }

  /**
   * Busca banco por ID
   */
  async getBankById(id: number): Promise<Bank> {
    try {
      const bank = await bankRepository.findById(id);
      if (!bank) {
        throw new AppError(404, "Banco não encontrado");
      }
      return bank;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao buscar banco:", error);
      throw new AppError(500, "Erro ao buscar banco");
    }
  }

  /**
   * Cria novo banco
   */
  async createBank(bankData: BankInput): Promise<Bank> {
    try {
      return await bankRepository.create(bankData);
    } catch (error) {
      console.error("Erro ao criar banco:", error);
      throw new AppError(500, "Erro ao criar banco");
    }
  }

  /**
   * Atualiza banco
   */
  async updateBank(id: number, bankData: Partial<BankInput>): Promise<Bank> {
    try {
      const exists = await bankRepository.exists(id);
      if (!exists) {
        throw new AppError(404, "Banco não encontrado");
      }

      const updatedBank = await bankRepository.update(id, bankData);
      if (!updatedBank) {
        throw new AppError(500, "Erro ao atualizar banco");
      }

      return updatedBank;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao atualizar banco:", error);
      throw new AppError(500, "Erro ao atualizar banco");
    }
  }

  /**
   * Exclui banco
   */
  async deleteBank(id: number): Promise<void> {
    try {
      const exists = await bankRepository.exists(id);
      if (!exists) {
        throw new AppError(404, "Banco não encontrado");
      }

      const deleted = await bankRepository.delete(id);
      if (!deleted) {
        throw new AppError(500, "Erro ao excluir banco");
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
          "Não é possível excluir este banco porque ele está vinculado a transações ou outros registros.",
        );
      }

      console.error("Erro ao excluir banco:", error);
      throw new AppError(500, "Erro ao excluir banco");
    }
  }
}

export default new BankService();
