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
} from "@/types/investimento";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export const investimentoAtivoService = {
  /**
   * Obtém os anos disponíveis para os ativos
   */
  async getAvailableYears(filters: {
    banco_id?: number;
    ativo?: boolean;
  } = {}): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      "/api/investimentos/ativos/anos",
      { params: filters },
    );

    return response.data.data || [];
  },

  /**
   * Lista todos os ativos de investimento com filtros e paginação
   */
  async getAll(
    filters: InvestimentoAtivoFilters = {},
  ): Promise<PaginatedResponse<InvestimentoAtivo[]>> {
    const response = await apiClient.get<PaginatedResponse<InvestimentoAtivo[]>>(
      "/api/investimentos/ativos",
      { params: filters },
    );
    return response.data;
  },

  /**
   * Busca um ativo de investimento por ID
   */
  async getById(id: number): Promise<InvestimentoAtivo> {
    const response = await apiClient.get<ApiResponse<InvestimentoAtivo>>(
      `/api/investimentos/ativos/${id}`,
    );
    return response.data.data;
  },

  /**
   * Cria um novo ativo de investimento
   */
  async create(input: InvestimentoAtivoInput): Promise<InvestimentoAtivo> {
    const response = await apiClient.post<ApiResponse<InvestimentoAtivo>>(
      "/api/investimentos/ativos",
      input,
    );
    return response.data.data;
  },

  /**
   * Atualiza um ativo de investimento existente
   */
  async update(
    id: number,
    input: Partial<InvestimentoAtivoInput>,
  ): Promise<InvestimentoAtivo> {
    const response = await apiClient.put<ApiResponse<InvestimentoAtivo>>(
      `/api/investimentos/ativos/${id}`,
      input,
    );
    return response.data.data;
  },

  /**
   * Exclui um ativo de investimento
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/investimentos/ativos/${id}`);
  },
};

export const investimentoMovimentacaoService = {
  /**
   * Lista todas as movimentações de investimento com filtros e paginação
   */
  async getAll(
    filters: InvestimentoMovimentacaoFilters = {},
  ): Promise<PaginatedResponse<InvestimentoMovimentacao[]>> {
    const response = await apiClient.get<PaginatedResponse<InvestimentoMovimentacao[]>>(
      "/api/investimentos/movimentacoes",
      { params: filters },
    );
    return response.data;
  },

  /**
   * Busca uma movimentação de investimento por ID
   */
  async getById(id: number): Promise<InvestimentoMovimentacao> {
    const response = await apiClient.get<ApiResponse<InvestimentoMovimentacao>>(
      `/api/investimentos/movimentacoes/${id}`,
    );
    return response.data.data;
  },

  /**
   * Cria uma nova movimentação de investimento
   */
  async create(
    input: InvestimentoMovimentacaoInput,
  ): Promise<InvestimentoMovimentacao> {
    const response = await apiClient.post<ApiResponse<InvestimentoMovimentacao>>(
      "/api/investimentos/movimentacoes",
      input,
    );
    return response.data.data;
  },

  /**
   * Atualiza uma movimentação de investimento existente
   */
  async update(
    id: number,
    input: Partial<InvestimentoMovimentacaoInput>,
  ): Promise<InvestimentoMovimentacao> {
    const response = await apiClient.put<ApiResponse<InvestimentoMovimentacao>>(
      `/api/investimentos/movimentacoes/${id}`,
      input,
    );
    return response.data.data;
  },

  /**
   * Exclui uma movimentação de investimento
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/investimentos/movimentacoes/${id}`);
  },
};

export const investimentoDashboardService = {
  /**
   * Obtém os anos disponíveis para o dashboard
   */
  async getAvailableYears(filters: {
    banco_id?: number;
    ativo?: boolean;
  } = {}): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      "/api/investimentos/dashboard/anos",
      { params: filters },
    );

    return response.data.data || [];
  },

  /**
   * Obtém os dados consolidados do dashboard de investimentos
   */
  async get(
    filters: InvestimentoDashboardFilters = {},
  ): Promise<InvestimentoDashboardResponse> {
    const response = await apiClient.get<ApiResponse<InvestimentoDashboardResponse>>(
      "/api/investimentos/dashboard",
      { params: filters },
    );

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
