export type CategoryType = "RECEITA" | "DESPESA";

export interface Category {
  id: number;
  nome: string;
  tipo: CategoryType;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryInput {
  nome: string;
  tipo: CategoryType;
  ativo?: boolean;
}

export interface CategoryFilters {
  search?: string;
  ativo?: boolean;
  tipo?: CategoryType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}
