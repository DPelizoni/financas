import apiClient from "@/services/apiClient";
import {
  Category,
  CategoryInput,
  CategoryType,
  PaginatedResponse,
} from "@/types/category";

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  ativo?: boolean;
  tipo?: CategoryType;
}

export const categoryService = {
  async getAll(
    filters?: CategoryFilters,
  ): Promise<PaginatedResponse<Category[]>> {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.search) params.append("search", filters.search);
    if (filters?.ativo !== undefined)
      params.append("ativo", filters.ativo.toString());
    if (filters?.tipo) params.append("tipo", filters.tipo);

    const response = await apiClient.get<PaginatedResponse<Category[]>>(
      `/api/categories?${params}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Category> {
    const response = await apiClient.get<{ success: boolean; data: Category }>(
      `/api/categories/${id}`,
    );
    return response.data.data;
  },

  async create(category: CategoryInput): Promise<Category> {
    const response = await apiClient.post<{ success: boolean; data: Category }>(
      "/api/categories",
      category,
    );
    return response.data.data;
  },

  async update(
    id: number,
    category: Partial<CategoryInput>,
  ): Promise<Category> {
    const response = await apiClient.put<{ success: boolean; data: Category }>(
      `/api/categories/${id}`,
      category,
    );
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/categories/${id}`);
  },
};
