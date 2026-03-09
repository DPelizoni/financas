import axios from "axios";
import {
  Category,
  CategoryInput,
  CategoryType,
  PaginatedResponse,
} from "@/types/category";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

    const response = await api.get<PaginatedResponse<Category[]>>(
      `/api/categories?${params}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Category> {
    const response = await api.get<{ success: boolean; data: Category }>(
      `/api/categories/${id}`,
    );
    return response.data.data;
  },

  async create(category: CategoryInput): Promise<Category> {
    const response = await api.post<{ success: boolean; data: Category }>(
      "/api/categories",
      category,
    );
    return response.data.data;
  },

  async update(
    id: number,
    category: Partial<CategoryInput>,
  ): Promise<Category> {
    const response = await api.put<{ success: boolean; data: Category }>(
      `/api/categories/${id}`,
      category,
    );
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/categories/${id}`);
  },
};
