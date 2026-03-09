export interface Transacao {
  id: number;
  mes: string; // MM/AAAA format
  vencimento: string; // DD/MM/AAAA format
  tipo: "DESPESA" | "RECEITA";
  categoria_id: number;
  descricao_id: number;
  banco_id: number;
  situacao: "PENDENTE" | "PAGO";
  valor: number;
  created_at: Date;
  updated_at: Date;
}

export interface TransacaoComDetalhes extends Transacao {
  categoria_nome?: string;
  descricao_nome?: string;
  banco_nome?: string;
}
