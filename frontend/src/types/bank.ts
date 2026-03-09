export interface Bank {
  id: number;
  nome: string;
  codigo?: string;
  cor: string;
  icone?: string;
  saldo_inicial: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankInput {
  nome: string;
  codigo?: string;
  cor?: string;
  icone?: string;
  saldo_inicial?: number;
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
