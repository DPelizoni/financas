import { BaseFilters } from "./api";

export type CategoryType = "RECEITA" | "DESPESA";

export interface Category {
  id: number;
  nome: string;
  tipo: CategoryType;
  cor: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  nome: string;
  tipo: CategoryType;
  cor?: string;
  ativo?: boolean;
}

export interface CategoryFilters extends BaseFilters {
  ativo?: boolean;
  tipo?: CategoryType;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}
