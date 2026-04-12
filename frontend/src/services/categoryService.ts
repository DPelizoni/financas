import apiClient from "@/services/apiClient";
import { Category, CategoryInput, CategoryFilters } from "@/types/category";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export const categoryService = {
  /**
   * Lista todas as categorias com filtros e paginação
   */
  async getAll(
    filters?: CategoryFilters,
  ): Promise<PaginatedResponse<Category[]>> {
    const response = await apiClient.get<PaginatedResponse<Category[]>>(
      "/api/categories",
      { params: filters },
    );
    return response.data;
  },

  /**
   * Busca uma categoria por ID
   */
  async getById(id: number): Promise<Category> {
    const response = await apiClient.get<ApiResponse<Category>>(
      `/api/categories/${id}`,
    );
    return response.data.data;
  },

  /**
   * Cria uma nova categoria
   */
  async create(category: CategoryInput): Promise<Category> {
    const response = await apiClient.post<ApiResponse<Category>>(
      "/api/categories",
      category,
    );
    return response.data.data;
  },

  /**
   * Atualiza uma categoria existente
   */
  async update(
    id: number,
    category: Partial<CategoryInput>,
  ): Promise<Category> {
    const response = await apiClient.put<ApiResponse<Category>>(
      `/api/categories/${id}`,
      category,
    );
    return response.data.data;
  },

  /**
   * Exclui uma categoria
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/categories/${id}`);
  },
};
