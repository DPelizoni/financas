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
