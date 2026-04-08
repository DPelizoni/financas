import apiClient from "@/services/apiClient";
import {
  InvestimentoAtivo,
  InvestimentoAtivoFilters,
  InvestimentoAtivoInput,
  InvestimentoDashboardFilters,
  InvestimentoDashboardResponse,
  InvestimentoMovimentacao,
  InvestimentoMovimentacaoFilters,
  InvestimentoMovimentacaoInput,
  PaginatedResponse,
} from "@/types/investimento";

export const investimentoAtivoService = {
  async getAvailableYears(filters: {
    banco_id?: number;
    ativo?: boolean;
  } = {}): Promise<string[]> {
    const params = new URLSearchParams();
    if (filters.banco_id) params.append("banco_id", String(filters.banco_id));
    if (filters.ativo !== undefined) params.append("ativo", String(filters.ativo));

    const response = await apiClient.get<{
      success: boolean;
      data: string[];
    }>(`/api/investimentos/ativos/anos?${params}`);

    return response.data.data || [];
  },

  async getAll(
    filters: InvestimentoAtivoFilters = {},
  ): Promise<PaginatedResponse<InvestimentoAtivo[]>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.search) params.append("search", filters.search);
    if (filters.banco_id) params.append("banco_id", String(filters.banco_id));
    if (filters.ativo !== undefined) params.append("ativo", String(filters.ativo));
    if (filters.data_de) params.append("data_de", filters.data_de);
    if (filters.data_ate) params.append("data_ate", filters.data_ate);

    const response = await apiClient.get<PaginatedResponse<InvestimentoAtivo[]>>(
      `/api/investimentos/ativos?${params}`,
    );
    return response.data;
  },

  async getById(id: number): Promise<InvestimentoAtivo> {
    const response = await apiClient.get<{
      success: boolean;
      data: InvestimentoAtivo;
    }>(`/api/investimentos/ativos/${id}`);
    return response.data.data;
  },

  async create(input: InvestimentoAtivoInput): Promise<InvestimentoAtivo> {
    const response = await apiClient.post<{
      success: boolean;
      data: InvestimentoAtivo;
    }>("/api/investimentos/ativos", input);
    return response.data.data;
  },

  async update(
    id: number,
    input: Partial<InvestimentoAtivoInput>,
  ): Promise<InvestimentoAtivo> {
    const response = await apiClient.put<{
      success: boolean;
      data: InvestimentoAtivo;
    }>(`/api/investimentos/ativos/${id}`, input);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/investimentos/ativos/${id}`);
  },
};

export const investimentoMovimentacaoService = {
  async getAll(
    filters: InvestimentoMovimentacaoFilters = {},
  ): Promise<PaginatedResponse<InvestimentoMovimentacao[]>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.search) params.append("search", filters.search);
    if (filters.investimento_ativo_id) {
      params.append(
        "investimento_ativo_id",
        String(filters.investimento_ativo_id),
      );
    }
    if (filters.banco_id) params.append("banco_id", String(filters.banco_id));
    if (filters.ativo !== undefined) params.append("ativo", String(filters.ativo));
    if (filters.tipo) params.append("tipo", filters.tipo);
    if (filters.data_de) params.append("data_de", filters.data_de);
    if (filters.data_ate) params.append("data_ate", filters.data_ate);

    const response = await apiClient.get<
      PaginatedResponse<InvestimentoMovimentacao[]>
    >(`/api/investimentos/movimentacoes?${params}`);
    return response.data;
  },

  async getById(id: number): Promise<InvestimentoMovimentacao> {
    const response = await apiClient.get<{
      success: boolean;
      data: InvestimentoMovimentacao;
    }>(`/api/investimentos/movimentacoes/${id}`);
    return response.data.data;
  },

  async create(
    input: InvestimentoMovimentacaoInput,
  ): Promise<InvestimentoMovimentacao> {
    const response = await apiClient.post<{
      success: boolean;
      data: InvestimentoMovimentacao;
    }>("/api/investimentos/movimentacoes", input);
    return response.data.data;
  },

  async update(
    id: number,
    input: Partial<InvestimentoMovimentacaoInput>,
  ): Promise<InvestimentoMovimentacao> {
    const response = await apiClient.put<{
      success: boolean;
      data: InvestimentoMovimentacao;
    }>(`/api/investimentos/movimentacoes/${id}`, input);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/investimentos/movimentacoes/${id}`);
  },
};

export const investimentoDashboardService = {
  async getAvailableYears(filters: {
    banco_id?: number;
    ativo?: boolean;
  } = {}): Promise<string[]> {
    const params = new URLSearchParams();
    if (filters.banco_id) params.append("banco_id", String(filters.banco_id));
    if (filters.ativo !== undefined) params.append("ativo", String(filters.ativo));

    const response = await apiClient.get<{
      success: boolean;
      data: string[];
    }>(`/api/investimentos/dashboard/anos?${params}`);

    return response.data.data || [];
  },

  async get(
    filters: InvestimentoDashboardFilters = {},
  ): Promise<InvestimentoDashboardResponse> {
    const params = new URLSearchParams();
    if (filters.banco_id) params.append("banco_id", String(filters.banco_id));
    if (filters.ativo !== undefined) params.append("ativo", String(filters.ativo));
    if (filters.data_de) params.append("data_de", filters.data_de);
    if (filters.data_ate) params.append("data_ate", filters.data_ate);

    const response = await apiClient.get<{
      success: boolean;
      data: InvestimentoDashboardResponse;
    }>(`/api/investimentos/dashboard?${params}`);

    const raw = response.data.data;
    return {
      cards: {
        aporte: Number(raw.cards?.aporte || 0),
        resgate: Number(raw.cards?.resgate || 0),
        rendimentos: Number(raw.cards?.rendimentos || 0),
        liquido: Number(raw.cards?.liquido || 0),
      },
      carteira: {
        total_ativos: Number(raw.carteira?.total_ativos || 0),
        saldo_total: Number(raw.carteira?.saldo_total || 0),
        ativos: raw.carteira?.ativos || [],
      },
      timeline: (raw.timeline || []).map((item: any) => ({
        month_key: String(item.month_key || ""),
        month_label: String(item.month_label || ""),
        aporte: Number(item.aporte || 0),
        resgate: Number(item.resgate || 0),
        rendimentos: Number(item.rendimentos || 0),
        saldo: Number(item.saldo || 0),
      })),
    };
  },
};
