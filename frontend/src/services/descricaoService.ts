import axios from "axios";
import {
  Descricao,
  DescricaoInput,
  DescricaoFilters,
  DescricaoResponse,
} from "@/types/descricao";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api`;

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

    const response = await axios.get<DescricaoResponse>(
      `${API_BASE_URL}/descricoes${params.toString() ? `?${params}` : ""}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Descricao> {
    const response = await axios.get<Descricao>(
      `${API_BASE_URL}/descricoes/${id}`,
    );
    return response.data;
  },

  async create(input: DescricaoInput): Promise<Descricao> {
    const response = await axios.post<Descricao>(
      `${API_BASE_URL}/descricoes`,
      input,
    );
    return response.data;
  },

  async update(id: number, input: Partial<DescricaoInput>): Promise<Descricao> {
    const response = await axios.put<Descricao>(
      `${API_BASE_URL}/descricoes/${id}`,
      input,
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/descricoes/${id}`);
  },
};

export type { DescricaoFilters };
