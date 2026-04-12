import apiClient from "@/services/apiClient";
import {
  Transacao,
  TransacaoInput,
  TransacaoFilters,
  TransacaoSummary,
  CopyMonthPayload,
  CopyMonthResult,
  DeleteMonthsPayload,
  DeleteMonthsResult,
  DeleteTransactionMonthsPayload,
  DeleteTransactionMonthsResult,
  CreateBatchPayload,
  CreateBatchResult,
} from "@/types/transacao";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export const transacaoService = {
  /**
   * Lista todas as transações com filtros e paginação
   */
  async getAll(filters: TransacaoFilters): Promise<PaginatedResponse<Transacao[]>> {
    const response = await apiClient.get<PaginatedResponse<Transacao[]>>(
      "/api/transacoes",
      { params: filters },
    );
    return response.data;
  },

  /**
   * Busca uma transação por ID
   */
  async getById(id: number): Promise<Transacao> {
    const response = await apiClient.get<ApiResponse<Transacao>>(
      `/api/transacoes/${id}`,
    );
    return response.data.data;
  },

  /**
   * Cria uma nova transação
   */
  async create(data: TransacaoInput): Promise<Transacao> {
    const response = await apiClient.post<ApiResponse<Transacao>>(`/api/transacoes`, data);
    return response.data.data;
  },

  /**
   * Cria múltiplas transações em lote
   */
  async createBatch(payload: CreateBatchPayload): Promise<CreateBatchResult> {
    const response = await apiClient.post<ApiResponse<CreateBatchResult>>(
      `/api/transacoes/batch`,
      payload,
    );

    return response.data.data;
  },

  /**
   * Atualiza uma transação existente
   */
  async update(id: number, data: Partial<TransacaoInput>): Promise<Transacao> {
    const response = await apiClient.put<ApiResponse<Transacao>>(
      `/api/transacoes/${id}`,
      data,
    );
    return response.data.data;
  },

  /**
   * Exclui uma transação
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/transacoes/${id}`);
  },

  /**
   * Obtém resumo financeiro baseado em filtros
   */
  async getSummary(
    filters: Omit<TransacaoFilters, "page" | "limit"> = {},
  ): Promise<TransacaoSummary> {
    const response = await apiClient.get<ApiResponse<TransacaoSummary>>(
      `/api/transacoes/summary`,
      { params: filters },
    );

    return response.data.data;
  },

  /**
   * Copia transações de um mês para outros
   */
  async copyByMonth(payload: CopyMonthPayload): Promise<CopyMonthResult> {
    const response = await apiClient.post<ApiResponse<CopyMonthResult>>(
      `/api/transacoes/copy-month`,
      payload,
    );

    return response.data.data;
  },

  /**
   * Exclui todas as transações de múltiplos meses
   */
  async deleteByMonths(
    payload: DeleteMonthsPayload,
  ): Promise<DeleteMonthsResult> {
    const response = await apiClient.delete<ApiResponse<DeleteMonthsResult>>(
      `/api/transacoes/delete-months`,
      { data: payload },
    );

    return response.data.data;
  },

  /**
   * Exclui uma transação específica em múltiplos meses
   */
  async deleteByTransactionMonths(
    payload: DeleteTransactionMonthsPayload,
  ): Promise<DeleteTransactionMonthsResult> {
    const response = await apiClient.delete<ApiResponse<DeleteTransactionMonthsResult>>(
      `/api/transacoes/delete-transaction-months`,
      { data: payload },
    );

    return response.data.data;
  },
};
