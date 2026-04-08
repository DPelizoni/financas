export type InvestimentoMovimentacaoTipo =
  | "APORTE"
  | "RESGATE"
  | "RENDIMENTO";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InvestimentoAtivo {
  id: number;
  nome: string;
  banco_id: number;
  banco_nome?: string;
  saldo_inicial: number;
  data_saldo_inicial: string;
  ativo: boolean;
  total_aporte?: number;
  total_resgate?: number;
  total_rendimento?: number;
  saldo_atual?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InvestimentoAtivoInput {
  nome: string;
  banco_id: number;
  saldo_inicial: number;
  data_saldo_inicial: string;
  ativo?: boolean;
}

export interface InvestimentoAtivoFilters {
  page?: number;
  limit?: number;
  search?: string;
  banco_id?: number;
  ativo?: boolean;
  data_de?: string;
  data_ate?: string;
}

export interface InvestimentoMovimentacao {
  id: number;
  investimento_ativo_id: number;
  ativo_nome?: string;
  ativo_status?: boolean;
  banco_id?: number;
  banco_nome?: string;
  tipo: InvestimentoMovimentacaoTipo;
  data: string;
  valor: number;
  created_at?: string;
  updated_at?: string;
}

export interface InvestimentoMovimentacaoInput {
  investimento_ativo_id: number;
  tipo: InvestimentoMovimentacaoTipo;
  data: string;
  valor: number;
}

export interface InvestimentoMovimentacaoFilters {
  page?: number;
  limit?: number;
  search?: string;
  investimento_ativo_id?: number;
  banco_id?: number;
  ativo?: boolean;
  tipo?: InvestimentoMovimentacaoTipo;
  data_de?: string;
  data_ate?: string;
}

export interface InvestimentoDashboardCards {
  aporte: number;
  resgate: number;
  rendimentos: number;
  liquido: number;
}

export interface InvestimentoDashboardTimelinePoint {
  month_key: string;
  month_label: string;
  aporte: number;
  resgate: number;
  rendimentos: number;
  saldo: number;
}

export interface InvestimentoDashboardResponse {
  cards: InvestimentoDashboardCards;
  carteira: {
    total_ativos: number;
    saldo_total: number;
    ativos: InvestimentoAtivo[];
  };
  timeline: InvestimentoDashboardTimelinePoint[];
}

export interface InvestimentoDashboardFilters {
  banco_id?: number;
  ativo?: boolean;
  data_de?: string;
  data_ate?: string;
}
