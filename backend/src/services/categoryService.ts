import categoryRepository from "../repositories/categoryRepository";
import { AppError } from "../middlewares/errorHandler";
import { Category, CategoryInput, CategoryFilters } from "../models/Category";

export class CategoryService {
  async getAllCategories(
    filters: CategoryFilters,
  ): Promise<{ categories: Category[]; total: number }> {
    try {
      return await categoryRepository.findAll(filters);
    } catch (error) {
      console.error("Erro ao listar categorias:", error);
      throw new AppError(500, "Erro ao listar categorias");
    }
  }

  async getCategoryById(id: number): Promise<Category> {
    try {
      const category = await categoryRepository.findById(id);
      if (!category) {
        throw new AppError(404, "Categoria não encontrada");
      }
      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao buscar categoria:", error);
      throw new AppError(500, "Erro ao buscar categoria");
    }
  }

  async createCategory(categoryData: CategoryInput): Promise<Category> {
    try {
      return await categoryRepository.create(categoryData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao criar categoria:", error);
      throw new AppError(500, "Erro ao criar categoria");
    }
  }

  async updateCategory(
    id: number,
    categoryData: Partial<CategoryInput>,
  ): Promise<Category> {
    try {
      const exists = await categoryRepository.exists(id);
      if (!exists) {
        throw new AppError(404, "Categoria não encontrada");
      }

      const updatedCategory = await categoryRepository.update(id, categoryData);
      if (!updatedCategory) {
        throw new AppError(500, "Erro ao atualizar categoria");
      }

      return updatedCategory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao atualizar categoria:", error);
      throw new AppError(500, "Erro ao atualizar categoria");
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      const exists = await categoryRepository.exists(id);
      if (!exists) {
        throw new AppError(404, "Categoria não encontrada");
      }

      const deleted = await categoryRepository.delete(id);
      if (!deleted) {
        throw new AppError(500, "Erro ao excluir categoria");
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
          "Não é possível excluir esta categoria porque ela está vinculada a descrições ou transações.",
        );
      }

      console.error("Erro ao excluir categoria:", error);
      throw new AppError(500, "Erro ao excluir categoria");
    }
  }
}

export default new CategoryService();
