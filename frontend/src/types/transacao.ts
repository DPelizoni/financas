export interface Transacao {
  id: number;
  mes: string;
  vencimento: string;
  tipo: "DESPESA" | "RECEITA";
  categoria_id: number;
  descricao_id: number;
  banco_id: number;
  situacao: "PENDENTE" | "PAGO";
  valor: number;
  categoria_nome?: string;
  descricao_nome?: string;
  banco_nome?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransacaoInput {
  mes: string;
  vencimento: string;
  tipo: "DESPESA" | "RECEITA";
  categoria_id: number;
  descricao_id: number;
  banco_id: number;
  situacao: "PENDENTE" | "PAGO";
  valor: number;
}

export interface TransacaoFilters {
  page?: number;
  limit?: number;
  search?: string;
  tipo?: "DESPESA" | "RECEITA";
  categoria_id?: number;
  banco_id?: number;
  situacao?: "PENDENTE" | "PAGO";
  mes?: string;
}

export interface TransacaoResponse {
  success: boolean;
  message: string;
  data: Transacao[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransacaoSummary {
  total_pago: number;
  total_pendente: number;
  total_registros: number;
  total_receita: number;
  total_despesa: number;
  total_liquido: number;
  pago_receita: number;
  pago_despesa: number;
  pago_liquido: number;
  provisao_receita: number;
  provisao_despesa: number;
  provisao_liquido: number;
}
