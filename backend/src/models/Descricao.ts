export interface Descricao {
  id: number;
  nome: string;
  categoria_id: number;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DescricaoInput {
  nome: string;
  categoria_id: number;
  ativo?: boolean;
}

export interface DescricaoFilters {
  search?: string;
  ativo?: boolean;
  categoria_id?: number;
  page?: number;
  limit?: number;
}
