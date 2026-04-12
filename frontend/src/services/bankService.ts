import apiClient from "@/services/apiClient";
import { Bank, BankInput, BankFilters } from "@/types/bank";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export const bankService = {
  /**
   * Lista todos os bancos com filtros e paginação
   */
  async getAll(filters?: BankFilters): Promise<PaginatedResponse<Bank[]>> {
    const response = await apiClient.get<PaginatedResponse<Bank[]>>("/api/banks", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Busca um banco por ID
   */
  async getById(id: number): Promise<Bank> {
    const response = await apiClient.get<ApiResponse<Bank>>(`/api/banks/${id}`);
    return response.data.data;
  },

  /**
   * Cria um novo banco
   */
  async create(bank: BankInput): Promise<Bank> {
    const response = await apiClient.post<ApiResponse<Bank>>("/api/banks", bank);
    return response.data.data;
  },

  /**
   * Atualiza um banco existente
   */
  async update(id: number, bank: Partial<BankInput>): Promise<Bank> {
    const response = await apiClient.put<ApiResponse<Bank>>(`/api/banks/${id}`, bank);
    return response.data.data;
  },

  /**
   * Exclui um banco
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/banks/${id}`);
  },
};
