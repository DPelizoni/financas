export interface Descricao {
  id: number;
  nome: string;
  categoria_id: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DescricaoInput {
  nome: string;
  categoria_id: number;
  ativo?: boolean;
}

export interface DescricaoFilters {
  page?: number;
  limit?: number;
  search?: string;
  ativo?: boolean;
  categoria_id?: number;
}

export interface DescricaoResponse {
  data: Descricao[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}
