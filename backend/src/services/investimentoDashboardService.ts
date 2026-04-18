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

    // Garantir que a timeline tenha todos os meses no período solicitado
    let finalTimelineRows = timelineRows;
    const monthsToFill: string[] = [];

    if (normalizedFilters.data_de && normalizedFilters.data_ate) {
      const start = new Date(normalizedFilters.data_de + "T00:00:00");
      const end = new Date(normalizedFilters.data_ate + "T00:00:00");
      
      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      const last = new Date(end.getFullYear(), end.getMonth(), 1);

      // Limitar a um máximo razoável de meses para evitar loops infinitos ou memória excessiva
      let safetyCounter = 0;
      while (current <= last && safetyCounter < 120) { // Máximo 10 anos
        monthsToFill.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
        current.setMonth(current.getMonth() + 1);
        safetyCounter++;
      }
    } else if (!normalizedFilters.data_de && !normalizedFilters.data_ate) {
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthsToFill.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
    }

    if (monthsToFill.length > 0) {
      const timelineMap = new Map(timelineRows.map((r) => [r.month_key, r]));
      finalTimelineRows = monthsToFill.map((monthKey) => {
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
      ativo: normalizedFilters.ativo,
    });

    // 2. Mapear saldos iniciais por mês de início
    const initialBalancesByMonth = new Map<string, number>();
    carteiraAtivos.forEach((ativo) => {
      if (ativo.data_saldo_inicial) {
        const monthKey = ativo.data_saldo_inicial.substring(0, 7); // YYYY-MM
        const current = initialBalancesByMonth.get(monthKey) || 0;
        initialBalancesByMonth.set(
          monthKey,
          current + Number(ativo.saldo_inicial || 0),
        );
      }
    });

    // 3. Identificar todos os meses que possuem alguma atividade (movimentação ou início de ativo)
    const activityMonths = new Set([
      ...allTimelineRows.map((r) => r.month_key),
      ...initialBalancesByMonth.keys(),
    ]);

    const sortedActivityMonths = Array.from(activityMonths).sort();

    // 4. Calcular o saldo acumulado cronologicamente
    const cumulativeMap = new Map<string, number>();
    let runningCumulativeSaldo = 0;

    // Precisamos iterar por todos os meses desde o primeiro mês de atividade até o último mês da timeline solicitada
    if (sortedActivityMonths.length > 0) {
      const firstMonthStr = sortedActivityMonths[0];
      const lastMonthStr =
        monthsToFill.length > 0
          ? monthsToFill[monthsToFill.length - 1]
          : sortedActivityMonths[sortedActivityMonths.length - 1];

      const [fYear, fMonth] = firstMonthStr.split("-").map(Number);
      const [lYear, lMonth] = lastMonthStr.split("-").map(Number);

      const startDate = new Date(fYear, fMonth - 1, 1);
      const endDate = new Date(lYear, lMonth - 1, 1);

      const movementsMap = new Map(allTimelineRows.map((r) => [r.month_key, r]));

      let current = new Date(startDate);
      while (current <= endDate) {
        const mKey = `${current.getFullYear()}-${String(
          current.getMonth() + 1,
        ).padStart(2, "0")}`;

        // Soma saldo inicial se algum ativo começou neste mês
        runningCumulativeSaldo += initialBalancesByMonth.get(mKey) || 0;

        // Soma movimentações do mês
        const mov = movementsMap.get(mKey);
        if (mov) {
          runningCumulativeSaldo += mov.aporte + mov.rendimentos - mov.resgate;
        }

        cumulativeMap.set(mKey, runningCumulativeSaldo);
        current.setMonth(current.getMonth() + 1);
      }
    }

    const timeline = finalTimelineRows.map((row) => {
      const [year, month] = row.month_key.split("-");
      const monthLabel =
        year && month ? `${month}/${year.slice(2)}` : row.month_key;

      // O saldo exibido no gráfico agora será o acumulado até aquele mês.
      // Se o mês for anterior à primeira atividade, será 0.
      // Se for posterior, herda o último saldo calculado (runningCumulativeSaldo).
      const currentCumulativeSaldo =
        cumulativeMap.get(row.month_key) ??
        (row.month_key < (sortedActivityMonths[0] || "")
          ? 0
          : runningCumulativeSaldo);

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
