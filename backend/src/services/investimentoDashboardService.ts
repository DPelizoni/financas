import {
  InvestimentoDashboardFilters,
  InvestimentoDashboardResponse,
} from "../models/Investimento";
import { InvestimentoAtivoRepository } from "../repositories/investimentoAtivoRepository";
import { InvestimentoMovimentacaoRepository } from "../repositories/investimentoMovimentacaoRepository";

const normalizeDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
  }

  return value;
};

export class InvestimentoDashboardService {
  private ativoRepository = new InvestimentoAtivoRepository();
  private movimentacaoRepository = new InvestimentoMovimentacaoRepository();

  async getAvailableYears(filters: {
    banco_id?: number;
    ativo?: boolean;
  }): Promise<string[]> {
    return this.movimentacaoRepository.getAvailableYears(filters);
  }

  async getDashboard(
    filters: InvestimentoDashboardFilters,
  ): Promise<InvestimentoDashboardResponse> {
    const normalizedFilters = {
      ...filters,
      data_de: filters.data_de ? normalizeDate(filters.data_de) : undefined,
      data_ate: filters.data_ate ? normalizeDate(filters.data_ate) : undefined,
    };

    const [cards, carteiraAtivos, timelineRows] = await Promise.all([
      this.movimentacaoRepository.getSummary(normalizedFilters),
      this.ativoRepository.findCarteira({
        banco_id: normalizedFilters.banco_id,
        ativo: normalizedFilters.ativo,
      }),
      this.movimentacaoRepository.getTimeline(normalizedFilters),
    ]);

    const saldoTotal = carteiraAtivos.reduce(
      (acc, item) => acc + Number(item.saldo_atual || 0),
      0,
    );
    const saldoInicialTotal = carteiraAtivos.reduce(
      (acc, item) => acc + Number(item.saldo_inicial || 0),
      0,
    );
    const liquidoComSaldoInicial =
      saldoInicialTotal + cards.aporte + cards.rendimentos - cards.resgate;
    const timeline = timelineRows.map((row) => {
      const [year, month] = row.month_key.split("-");
      const monthLabel = year && month ? `${month}/${year.slice(2)}` : row.month_key;
      const saldo = row.aporte + row.rendimentos - row.resgate;

      return {
        month_key: row.month_key,
        month_label: monthLabel,
        aporte: row.aporte,
        resgate: row.resgate,
        rendimentos: row.rendimentos,
        saldo,
      };
    });

    return {
      cards: {
        ...cards,
        liquido: liquidoComSaldoInicial,
      },
      carteira: {
        total_ativos: carteiraAtivos.length,
        saldo_total: saldoTotal,
        ativos: carteiraAtivos,
      },
      timeline,
    };
  }
}
