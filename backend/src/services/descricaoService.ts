import descricaoRepository from "../repositories/descricaoRepository";
import categoryRepository from "../repositories/categoryRepository";
import {
  Descricao,
  DescricaoInput,
  DescricaoFilters,
} from "../models/Descricao";
import { AppError } from "../middlewares/errorHandler";

export class DescricaoService {
  async getAllDescricoes(
    filters: DescricaoFilters,
  ): Promise<{ descricoes: Descricao[]; total: number }> {
    try {
      return await descricaoRepository.findAll(filters);
    } catch (error) {
      console.error("Erro ao listar descrições:", error);
      throw new AppError(500, "Erro ao listar descrições");
    }
  }

  async getDescricaoById(id: number): Promise<Descricao> {
    try {
      const descricao = await descricaoRepository.findById(id);
      if (!descricao) {
        throw new AppError(404, "Descrição não encontrada");
      }
      return descricao;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao buscar descrição:", error);
      throw new AppError(500, "Erro ao buscar descrição");
    }
  }

  async createDescricao(descricaoData: DescricaoInput): Promise<Descricao> {
    try {
      // Validar que a categoria existe
      const categoryExists = await categoryRepository.exists(
        descricaoData.categoria_id,
      );
      if (!categoryExists) {
        throw new AppError(404, "Categoria não encontrada");
      }

      return await descricaoRepository.create(descricaoData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao criar descrição:", error);
      throw new AppError(500, "Erro ao criar descrição");
    }
  }

  async updateDescricao(
    id: number,
    descricaoData: Partial<DescricaoInput>,
  ): Promise<Descricao> {
    try {
      const exists = await descricaoRepository.exists(id);
      if (!exists) {
        throw new AppError(404, "Descrição não encontrada");
      }

      // Validar que a categoria existe, se for fornecida
      if (descricaoData.categoria_id !== undefined) {
        const categoryExists = await categoryRepository.exists(
          descricaoData.categoria_id,
        );
        if (!categoryExists) {
          throw new AppError(404, "Categoria não encontrada");
        }
      }

      return await descricaoRepository.update(id, descricaoData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao atualizar descrição:", error);
      throw new AppError(500, "Erro ao atualizar descrição");
    }
  }

  async deleteDescricao(id: number): Promise<void> {
    try {
      const exists = await descricaoRepository.exists(id);
      if (!exists) {
        throw new AppError(404, "Descrição não encontrada");
      }
      await descricaoRepository.delete(id);
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
          "Não é possível excluir esta descrição porque ela está vinculada a transações.",
        );
      }

      console.error("Erro ao deletar descrição:", error);
      throw new AppError(500, "Erro ao deletar descrição");
    }
  }
}

export default new DescricaoService();
