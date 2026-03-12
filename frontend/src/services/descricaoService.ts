import apiClient from "@/services/apiClient";
import {
  Descricao,
  DescricaoInput,
  DescricaoFilters,
  DescricaoResponse,
} from "@/types/descricao";

export const descricaoService = {
  async getAll(filters: DescricaoFilters): Promise<DescricaoResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.search) params.append("search", filters.search);
    if (filters.ativo !== undefined)
      params.append("ativo", String(filters.ativo));
    if (filters.categoria_id)
      params.append("categoria_id", String(filters.categoria_id));

    const response = await apiClient.get<DescricaoResponse>(
      `/api/descricoes${params.toString() ? `?${params}` : ""}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Descricao> {
    const response = await apiClient.get<Descricao>(`/api/descricoes/${id}`);
    return response.data;
  },

  async create(input: DescricaoInput): Promise<Descricao> {
    const response = await apiClient.post<Descricao>(`/api/descricoes`, input);
    return response.data;
  },

  async update(id: number, input: Partial<DescricaoInput>): Promise<Descricao> {
    const response = await apiClient.put<Descricao>(
      `/api/descricoes/${id}`,
      input,
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/descricoes/${id}`);
  },
};

export type { DescricaoFilters };
