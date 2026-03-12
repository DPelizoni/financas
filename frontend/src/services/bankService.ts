import apiClient from "@/services/apiClient";
import { Bank, BankInput, PaginatedResponse } from "@/types/bank";

export interface BankFilters {
  page?: number;
  limit?: number;
  search?: string;
  ativo?: boolean;
}

export const bankService = {
  async getAll(filters?: BankFilters): Promise<PaginatedResponse<Bank[]>> {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.search) params.append("search", filters.search);
    if (filters?.ativo !== undefined)
      params.append("ativo", filters.ativo.toString());

    const response = await apiClient.get<PaginatedResponse<Bank[]>>(
      `/api/banks?${params}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Bank> {
    const response = await apiClient.get<{ success: boolean; data: Bank }>(
      `/api/banks/${id}`,
    );
    return response.data.data;
  },

  async create(bank: BankInput): Promise<Bank> {
    const response = await apiClient.post<{ success: boolean; data: Bank }>(
      "/api/banks",
      bank,
    );
    return response.data.data;
  },

  async update(id: number, bank: Partial<BankInput>): Promise<Bank> {
    const response = await apiClient.put<{ success: boolean; data: Bank }>(
      `/api/banks/${id}`,
      bank,
    );
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/banks/${id}`);
  },
};
