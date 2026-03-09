export type CategoryType = "RECEITA" | "DESPESA";

export interface Category {
  id: number;
  nome: string;
  tipo: CategoryType;
  cor: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryInput {
  nome: string;
  tipo: CategoryType;
  cor?: string;
  ativo?: boolean;
}

export interface CategoryFilters {
  search?: string;
  ativo?: boolean;
  tipo?: CategoryType;
  page?: number;
  limit?: number;
}
