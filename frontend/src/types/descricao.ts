import { BaseFilters } from "./api";

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

export interface DescricaoFilters extends BaseFilters {
  ativo?: boolean;
  categoria_id?: number;
}
