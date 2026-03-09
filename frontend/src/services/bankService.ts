import axios from "axios";
import { Bank, BankInput, PaginatedResponse } from "@/types/bank";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

    const response = await api.get<PaginatedResponse<Bank[]>>(
      `/api/banks?${params}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Bank> {
    const response = await api.get<{ success: boolean; data: Bank }>(
      `/api/banks/${id}`,
    );
    return response.data.data;
  },

  async create(bank: BankInput): Promise<Bank> {
    const response = await api.post<{ success: boolean; data: Bank }>(
      "/api/banks",
      bank,
    );
    return response.data.data;
  },

  async update(id: number, bank: Partial<BankInput>): Promise<Bank> {
    const response = await api.put<{ success: boolean; data: Bank }>(
      `/api/banks/${id}`,
      bank,
    );
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/banks/${id}`);
  },
};
