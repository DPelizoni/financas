import apiClient from "@/services/apiClient";
import {
  Descricao,
  DescricaoInput,
  DescricaoFilters,
} from "@/types/descricao";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export const descricaoService = {
  /**
   * Lista todas as descrições com filtros e paginação
   */
  async getAll(filters: DescricaoFilters): Promise<PaginatedResponse<Descricao[]>> {
    const response = await apiClient.get<PaginatedResponse<Descricao[]>>(
      "/api/descricoes",
      { params: filters },
    );
    return response.data;
  },

  /**
   * Busca uma descrição por ID
   */
  async getById(id: number): Promise<Descricao> {
    const response = await apiClient.get<ApiResponse<Descricao>>(`/api/descricoes/${id}`);
    return response.data.data;
  },

  /**
   * Cria uma nova descrição
   */
  async create(input: DescricaoInput): Promise<Descricao> {
    const response = await apiClient.post<ApiResponse<Descricao>>("/api/descricoes", input);
    return response.data.data;
  },

  /**
   * Atualiza uma descrição existente
   */
  async update(id: number, input: Partial<DescricaoInput>): Promise<Descricao> {
    const response = await apiClient.put<ApiResponse<Descricao>>(
      `/api/descricoes/${id}`,
      input,
    );
    return response.data.data;
  },

  /**
   * Exclui uma descrição
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/descricoes/${id}`);
  },
};
