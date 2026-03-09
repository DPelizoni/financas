import { TransacaoRepository } from "../repositories/transacaoRepository";
import { BankRepository } from "../repositories/bankRepository";
import { CategoryRepository } from "../repositories/categoryRepository";
import { DescricaoRepository } from "../repositories/descricaoRepository";
import { Transacao, TransacaoComDetalhes } from "../models/Transacao";
import { AppError } from "../middlewares/errorHandler";

interface TransacaoFilters {
  page?: number;
  limit?: number;
  search?: string;
  tipo?: "DESPESA" | "RECEITA";
  categoria_id?: number;
  banco_id?: number;
  situacao?: "PENDENTE" | "PAGO";
  mes?: string;
}

export class TransacaoService {
  private transacaoRepository = new TransacaoRepository();
  private bankRepository = new BankRepository();
  private categoryRepository = new CategoryRepository();
  private descricaoRepository = new DescricaoRepository();

  async getAllTransacoes(filters: TransacaoFilters) {
    return this.transacaoRepository.findAll(filters);
  }

  async getById(id: number) {
    const transacao = await this.transacaoRepository.findById(id);
    if (!transacao) {
      throw new AppError(404, "Transação não encontrada");
    }
    return transacao;
  }

  async createTransacao(
    data: Omit<Transacao, "id" | "created_at" | "updated_at">,
  ) {
    // Cast para garantir que os IDs são números
    const banco_id = Number(data.banco_id);
    const categoria_id = Number(data.categoria_id);
    const descricao_id = Number(data.descricao_id);

    // Validate references
    const bancoExists = await this.bankRepository.findById(banco_id);
    if (!bancoExists) {
      throw new AppError(404, "Banco não encontrado");
    }

    const categoriaExists =
      await this.categoryRepository.findById(categoria_id);
    if (!categoriaExists) {
      throw new AppError(404, "Categoria não encontrada");
    }

    // Validate tipo matches categoria
    if (categoriaExists.tipo !== data.tipo) {
      throw new AppError(
        400,
        `Categoria do tipo ${categoriaExists.tipo} não pode ser usada com o tipo ${data.tipo}`,
      );
    }

    const descricaoExists =
      await this.descricaoRepository.findById(descricao_id);
    if (!descricaoExists) {
      throw new AppError(404, "Descrição não encontrada");
    }

    // Validate descricao belongs to categoria
    if (descricaoExists.categoria_id !== categoria_id) {
      throw new AppError(400, "Descrição não pertence à categoria selecionada");
    }

    return this.transacaoRepository.create(data);
  }

  async updateTransacao(
    id: number,
    data: Partial<Omit<Transacao, "id" | "created_at" | "updated_at">>,
  ) {
    const exists = await this.transacaoRepository.exists(id);
    if (!exists) {
      throw new AppError(404, "Transação não encontrada");
    }

    // Validate references if provided
    if (data.banco_id) {
      const banco_id = Number(data.banco_id);
      const bancoExists = await this.bankRepository.findById(banco_id);
      if (!bancoExists) {
        throw new AppError(404, "Banco não encontrado");
      }
    }

    if (data.categoria_id) {
      const categoria_id = Number(data.categoria_id);
      const categoriaExists =
        await this.categoryRepository.findById(categoria_id);
      if (!categoriaExists) {
        throw new AppError(404, "Categoria não encontrada");
      }

      if (data.tipo && categoriaExists.tipo !== data.tipo) {
        throw new AppError(
          400,
          `Categoria do tipo ${categoriaExists.tipo} não pode ser usada com o tipo ${data.tipo}`,
        );
      }
    }

    if (data.descricao_id) {
      const descricao_id = Number(data.descricao_id);
      const categoria_id = Number(data.categoria_id || 0);
      const descricaoExists =
        await this.descricaoRepository.findById(descricao_id);
      if (!descricaoExists) {
        throw new AppError(404, "Descrição não encontrada");
      }

      if (categoria_id > 0 && descricaoExists.categoria_id !== categoria_id) {
        throw new AppError(
          400,
          "Descrição não pertence à categoria selecionada",
        );
      }
    }

    return this.transacaoRepository.update(id, data);
  }

  async deleteTransacao(id: number) {
    try {
      const exists = await this.transacaoRepository.exists(id);
      if (!exists) {
        throw new AppError(404, "Transação não encontrada");
      }
      return this.transacaoRepository.delete(id);
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
          "Não é possível excluir esta transação porque ela está vinculada a outros registros.",
        );
      }

      throw new AppError(500, "Erro ao excluir transação");
    }
  }

  async getSummary(
    filters: {
      search?: string;
      tipo?: "DESPESA" | "RECEITA";
      categoria_id?: number;
      banco_id?: number;
      situacao?: "PENDENTE" | "PAGO";
      mes?: string;
    } = {},
  ) {
    return this.transacaoRepository.getSummary(filters);
  }
}
