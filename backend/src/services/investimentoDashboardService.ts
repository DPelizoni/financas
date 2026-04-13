import {
  InvestimentoDashboardFilters,
  InvestimentoDashboardResponse,
} from "../models/Investimento";
import ativoRepository from "../repositories/investimentoAtivoRepository";
import movimentacaoRepository from "../repositories/investimentoMovimentacaoRepository";

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
  /**
   * Obtém os anos disponíveis para o dashboard
   */
  async getAvailableYears(filters: {
    banco_id?: number;
    ativo?: boolean;
  }): Promise<string[]> {
    return movimentacaoRepository.getAvailableYears(filters);
  }

  /**
   * Obtém os dados consolidados do dashboard de investimentos
   */
  async getDashboard(
    filters: InvestimentoDashboardFilters,
  ): Promise<InvestimentoDashboardResponse> {
    const normalizedFilters = {
      ...filters,
      data_de: filters.data_de ? normalizeDate(filters.data_de) : undefined,
      data_ate: filters.data_ate ? normalizeDate(filters.data_ate) : undefined,
    };

    const [cards, carteiraAtivos, timelineRows] = await Promise.all([
      movimentacaoRepository.getSummary(normalizedFilters),
      ativoRepository.findCarteira({
        banco_id: normalizedFilters.banco_id,
        ativo: normalizedFilters.ativo,
      }),
      movimentacaoRepository.getTimeline(normalizedFilters),
    ]);

    const saldoTotal = carteiraAtivos.reduce(
      (acc, item) => acc + Number(item.saldo_atual || 0),
      0,
    );

    const saldoInicialTotal = carteiraAtivos.reduce(
      (acc, item) => acc + Number(item.saldo_inicial || 0),
      0,
    );

    // Se não houver filtro de data, garantimos os últimos 12 meses
    let finalTimelineRows = timelineRows;
    if (!normalizedFilters.data_de && !normalizedFilters.data_ate) {
      const last12Months: string[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        last12Months.push(monthKey);
      }

      const timelineMap = new Map(timelineRows.map((r) => [r.month_key, r]));
      finalTimelineRows = last12Months.map((monthKey) => {
        return (
          timelineMap.get(monthKey) || {
            month_key: monthKey,
            aporte: 0,
            resgate: 0,
            rendimentos: 0,
          }
        );
      });
    }

    // Para calcular o saldo acumulado em cada ponto da timeline, 
    // precisamos saber o saldo antes do primeiro ponto da timeline exibida.
    // Mas uma forma mais robusta é calcular o saldo acumulado total ate cada mes.
    
    // 1. Buscar todas as movimentações agrupadas por mês desde o início dos tempos (sem filtros de data)
    const allTimelineRows = await movimentacaoRepository.getTimeline({
        banco_id: normalizedFilters.banco_id,
        ativo: normalizedFilters.ativo
    });

    const cumulativeMap = new Map<string, number>();
    let runningSaldo = saldoInicialTotal;

    // Ordenar todas as linhas por data para calcular o acumulado
    const sortedAllRows = [...allTimelineRows].sort((a, b) => a.month_key.localeCompare(b.month_key));
    
    sortedAllRows.forEach(row => {
        runningSaldo += (row.aporte + row.rendimentos - row.resgate);
        cumulativeMap.set(row.month_key, runningSaldo);
    });

    const timeline = finalTimelineRows.map((row) => {
      const [year, month] = row.month_key.split("-");
      const monthLabel = year && month ? `${month}/${year.slice(2)}` : row.month_key;
      
      // O saldo exibido no gráfico agora será o acumulado até aquele mês
      // Se não houver registro no cumulativeMap para meses futuros sem movimentação, 
      // usamos o último runningSaldo calculado.
      const currentCumulativeSaldo = cumulativeMap.get(row.month_key) ?? runningSaldo;

      return {
        month_key: row.month_key,
        month_label: monthLabel,
        aporte: row.aporte,
        resgate: row.resgate,
        rendimentos: row.rendimentos,
        saldo: currentCumulativeSaldo,
      };
    });

    return {
      cards: {
        ...cards,
        liquido: saldoTotal,
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

export default new InvestimentoDashboardService();
