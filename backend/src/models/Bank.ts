export interface Bank {
  id: number;
  nome: string;
  codigo?: string;
  cor: string;
  icone?: string;
  saldo_inicial: number;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BankInput {
  nome: string;
  codigo?: string;
  cor?: string;
  icone?: string;
  saldo_inicial?: number;
  ativo?: boolean;
}

export interface BankFilters {
  search?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
}
