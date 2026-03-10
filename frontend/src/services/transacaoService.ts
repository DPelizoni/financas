import axios from "axios";
import {
  Transacao,
  TransacaoInput,
  TransacaoFilters,
  TransacaoResponse,
  TransacaoSummary,
  CopyMonthPayload,
  CopyMonthResult,
  DeleteMonthsPayload,
  DeleteMonthsResult,
} from "@/types/transacao";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api`;

export const transacaoService = {
  async getAll(filters: TransacaoFilters): Promise<TransacaoResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.tipo) params.append("tipo", filters.tipo);
    if (filters.categoria_id)
      params.append("categoria_id", filters.categoria_id.toString());
    if (filters.banco_id)
      params.append("banco_id", filters.banco_id.toString());
    if (filters.situacao) params.append("situacao", filters.situacao);
    if (filters.mes) params.append("mes", filters.mes);
    if (filters.ano) params.append("ano", filters.ano);

    const response = await axios.get<TransacaoResponse>(
      `${API_URL}/transacoes?${params}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<Transacao> {
    const response = await axios.get<{ success: boolean; data: Transacao }>(
      `${API_URL}/transacoes/${id}`,
    );
    return response.data.data;
  },

  async create(data: TransacaoInput): Promise<Transacao> {
    const response = await axios.post<{ success: boolean; data: Transacao }>(
      `${API_URL}/transacoes`,
      data,
    );
    return response.data.data;
  },

  async update(id: number, data: Partial<TransacaoInput>): Promise<Transacao> {
    const response = await axios.put<{ success: boolean; data: Transacao }>(
      `${API_URL}/transacoes/${id}`,
      data,
    );
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`${API_URL}/transacoes/${id}`);
  },

  async getSummary(
    filters: Omit<TransacaoFilters, "page" | "limit"> = {},
  ): Promise<TransacaoSummary> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.tipo) params.append("tipo", filters.tipo);
    if (filters.categoria_id)
      params.append("categoria_id", filters.categoria_id.toString());
    if (filters.banco_id)
      params.append("banco_id", filters.banco_id.toString());
    if (filters.situacao) params.append("situacao", filters.situacao);
    if (filters.mes) params.append("mes", filters.mes);
    if (filters.ano) params.append("ano", filters.ano);

    const response = await axios.get<{
      success: boolean;
      data: TransacaoSummary;
    }>(`${API_URL}/transacoes/summary?${params}`);

    const raw = response.data.data as any;
    return {
      total_pago: Number(raw.total_pago || 0),
      total_pendente: Number(raw.total_pendente || 0),
      total_registros: Number(raw.total_registros || 0),
      total_receita: Number(raw.total_receita || 0),
      total_despesa: Number(raw.total_despesa || 0),
      total_liquido: Number(raw.total_liquido || 0),
      pago_receita: Number(raw.pago_receita || 0),
      pago_despesa: Number(raw.pago_despesa || 0),
      pago_liquido: Number(raw.pago_liquido || 0),
      provisao_receita: Number(raw.provisao_receita || 0),
      provisao_despesa: Number(raw.provisao_despesa || 0),
      provisao_liquido: Number(raw.provisao_liquido || 0),
    };
  },

  async copyByMonth(payload: CopyMonthPayload): Promise<CopyMonthResult> {
    const response = await axios.post<{
      success: boolean;
      data: CopyMonthResult;
    }>(`${API_URL}/transacoes/copy-month`, payload);

    return response.data.data;
  },

  async deleteByMonths(
    payload: DeleteMonthsPayload,
  ): Promise<DeleteMonthsResult> {
    const response = await axios.delete<{
      success: boolean;
      data: DeleteMonthsResult;
    }>(`${API_URL}/transacoes/delete-months`, { data: payload });

    return response.data.data;
  },
};
