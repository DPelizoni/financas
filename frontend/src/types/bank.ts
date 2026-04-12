import { BaseFilters } from "./api";

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

export interface BankFilters extends BaseFilters {
  ativo?: boolean;
}
