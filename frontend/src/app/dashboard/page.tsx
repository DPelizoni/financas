"use client";

import { useEffect, useMemo, useState } from "react";
import { transacaoService } from "@/services/transacaoService";
import { categoryService } from "@/services/categoryService";
import { bankService } from "@/services/bankService";
import { Transacao } from "@/types/transacao";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { formatCurrency, formatMonthShort, previousMonthKey } from "@/utils/format";
import { parsePositiveInt, useUrlFilterSync } from "@/utils/useUrlFilterSync";

// New Components
import { SummaryCards } from "./components/SummaryCards";
import { DashboardFilters } from "./components/DashboardFilters";
import { DashboardCharts } from "./components/DashboardCharts";
import { DashboardTransactionsTable } from "./components/DashboardTransactionsTable";
import { UpcomingDues } from "./components/UpcomingDues";

interface MonthlyPoint {
  monthKey: string;
  monthLabel: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

const tipoLabel: Record<"DESPESA" | "RECEITA", string> = {
  DESPESA: "Despesa",
  RECEITA: "Receita",
};

const chartColors = {
  receitas: "rgb(var(--app-chart-receita))",
  despesas: "rgb(var(--app-chart-despesa))",
  saldo: "rgb(var(--app-chart-saldo))",
  pendente: "rgb(var(--app-chart-pendente))",
  pago: "rgb(var(--app-chart-pago))",
  pieA: "rgb(var(--app-chart-pie-a))",
  pieB: "rgb(var(--app-chart-pie-b))",
  pieC: "rgb(var(--app-chart-pie-c))",
  pieD: "rgb(var(--app-chart-pie-d))",
  pieE: "rgb(var(--app-chart-pie-e))",
};

const normalizeSeriesKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getTooltipSeriesColor = (
  seriesName: string,
  fallback = "rgb(var(--app-text-primary))",
): string => {
  const normalized = normalizeSeriesKey(seriesName || "");

  if (normalized.includes("receita")) return chartColors.receitas;
  if (normalized.includes("despesa")) return chartColors.despesas;
  if (normalized.includes("saldo") || normalized.includes("liquido")) {
    return chartColors.saldo;
  }
  if (normalized.includes("pago")) return chartColors.pago;
  if (normalized.includes("provisao") || normalized.includes("pendente")) {
    return chartColors.pendente;
  }

  return fallback;
};

const monthLabel = (monthKey: string): string => {
  const [, month] = monthKey.split("-");
  return month;
};

const parseMesToKey = (mes: string): string | null => {
  if (/^\d{2}\/\d{4}$/.test(mes)) {
    const [m, y] = mes.split("/");
    return `${y}-${m}`;
  }

  if (/^\d{4}-\d{2}$/.test(mes)) {
    return mes;
  }

  return null;
};

const currency = (value: number): string => formatCurrency(value);

const currentMonthValue = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${year}-${month}`;
};

export default function DashboardPage() {
  const currentYear = String(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Filtros globais
  const [periodMonths, setPeriodMonths] = useState(12);
  const [filterTipo, setFilterTipo] = useState<"TODOS" | "DESPESA" | "RECEITA">("TODOS");
  const [filterSituacao, setFilterSituacao] = useState<"TODOS" | "PENDENTE" | "PAGO">("TODOS");
  const [filterCategoria, setFilterCategoria] = useState<number | "TODOS">("TODOS");
  const [filterBanco, setFilterBanco] = useState<number | "TODOS">("TODOS");
  const [filterMesAno, setFilterMesAno] = useState(currentMonthValue);
  const [filterAno, setFilterAno] = useState<string>(currentYear);

  // Filtros na URL: permite recarregar, compartilhar e voltar ao mesmo estado
  const filtersReady = useUrlFilterSync(
    (params) => {
      const mes = params.get("mes");
      if (mes === "todos") setFilterMesAno("");
      else if (mes && /^\d{4}-\d{2}$/.test(mes)) setFilterMesAno(mes);
      const periodo = Number(params.get("periodo"));
      if (periodo === 3 || periodo === 6 || periodo === 12) setPeriodMonths(periodo);
      const ano = params.get("ano");
      if (ano === "todos") setFilterAno("TODOS");
      else if (ano && /^\d{4}$/.test(ano)) setFilterAno(ano);
      const tipo = params.get("tipo");
      if (tipo === "DESPESA" || tipo === "RECEITA") setFilterTipo(tipo);
      const situacao = params.get("situacao");
      if (situacao === "PAGO" || situacao === "PENDENTE") setFilterSituacao(situacao);
      const categoria = parsePositiveInt(params.get("categoria"));
      if (categoria) setFilterCategoria(categoria);
      const banco = parsePositiveInt(params.get("banco"));
      if (banco) setFilterBanco(banco);
    },
    {
      mes: filterMesAno === currentMonthValue() ? null : filterMesAno || "todos",
      periodo: periodMonths === 12 ? null : String(periodMonths),
      ano: filterAno === currentYear ? null : filterAno === "TODOS" ? "todos" : filterAno,
      tipo: filterTipo === "TODOS" ? null : filterTipo,
      situacao: filterSituacao === "TODOS" ? null : filterSituacao,
      categoria: filterCategoria === "TODOS" ? null : String(filterCategoria),
      banco: filterBanco === "TODOS" ? null : String(filterBanco),
    },
  );

  const handleClearFilters = () => {
    setFilterMesAno(currentMonthValue());
    setFilterAno(currentYear);
    setPeriodMonths(12);
    setFilterTipo("TODOS");
    setFilterSituacao("TODOS");
    setFilterCategoria("TODOS");
    setFilterBanco("TODOS");
  };

  const [tableSortBy, setTableSortBy] = useState<"mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor">("mes");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("asc");

  const handleTableSort = (column: "mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor") => {
    if (tableSortBy === column) {
      setTableSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setTableSortBy(column);
    setTableSortDirection("asc");
  };

  // TanStack Queries
  const { 
    data: transacoes = [], 
    isLoading: loadingTransacoes,
    isFetching: fetchingTransacoes 
  } = useQuery({
    queryKey: ["all-transacoes-dashboard"],
    queryFn: () => transacaoService.getAll({ page: 1, limit: 5000 }).then(res => res.data || []),
    placeholderData: (previousData) => previousData,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll({ page: 1, limit: 1000 }).then(res => res.data || []),
  });

  const { data: banks = [] } = useQuery({
    queryKey: ["banks"],
    queryFn: () => bankService.getAll({ page: 1, limit: 1000 }).then(res => res.data || []),
  });

  const filteredTransacoes = useMemo(() => {
    return transacoes.filter((t) => {
      const mesKey = parseMesToKey(t.mes);
      if (!mesKey) return false;
      if (filterTipo !== "TODOS" && t.tipo !== filterTipo) return false;
      if (filterSituacao !== "TODOS" && t.situacao !== filterSituacao) return false;
      if (filterCategoria !== "TODOS" && t.categoria_id !== filterCategoria) return false;
      if (filterBanco !== "TODOS" && t.banco_id !== filterBanco) return false;
      if (filterMesAno && mesKey !== filterMesAno) return false;
      if (filterAno !== "TODOS" && !filterMesAno && !mesKey.startsWith(`${filterAno}-`)) return false;
      return true;
    });
  }, [transacoes, filterTipo, filterSituacao, filterCategoria, filterBanco, filterMesAno, filterAno]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentYear);
    transacoes.forEach((t) => {
      const key = parseMesToKey(t.mes);
      if (key) years.add(key.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transacoes, currentYear]);

  const timeline = useMemo(() => {
    const allMonthsSet = new Set<string>();
    transacoes.forEach((t) => {
      const month = parseMesToKey(t.mes);
      if (month) {
        if (filterAno === "TODOS" || month.startsWith(`${filterAno}-`)) {
          allMonthsSet.add(month);
        }
      }
    });
    const sortedMonths = Array.from(allMonthsSet).sort();
    const selectedMonths = sortedMonths.slice(-periodMonths);

    return selectedMonths.map((monthKey) => {
      const monthItems = transacoes.filter((t) => {
        const tMesKey = parseMesToKey(t.mes);
        if (tMesKey !== monthKey) return false;
        if (filterTipo !== "TODOS" && t.tipo !== filterTipo) return false;
        if (filterSituacao !== "TODOS" && t.situacao !== filterSituacao) return false;
        if (filterCategoria !== "TODOS" && t.categoria_id !== filterCategoria) return false;
        if (filterBanco !== "TODOS" && t.banco_id !== filterBanco) return false;
        return true;
      });

      const receitas = monthItems.filter((t) => t.tipo === "RECEITA").reduce((acc, t) => acc + Number(t.valor), 0);
      const despesas = monthItems.filter((t) => t.tipo === "DESPESA").reduce((acc, t) => acc + Number(t.valor), 0);
      return {
        monthKey,
        monthLabel: monthLabel(monthKey),
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });
  }, [transacoes, periodMonths, filterAno, filterTipo, filterSituacao, filterCategoria, filterBanco]);

  const periodFilteredTransacoes = useMemo(() => {
    if (filterMesAno) return filteredTransacoes;
    const months = Array.from(new Set(filteredTransacoes.map((t) => parseMesToKey(t.mes)).filter((m): m is string => Boolean(m))))
      .sort()
      .slice(-periodMonths);
    const selectedMonths = new Set(months);
    return filteredTransacoes.filter((t) => {
      const key = parseMesToKey(t.mes);
      return key ? selectedMonths.has(key) : false;
    });
  }, [filteredTransacoes, filterMesAno, periodMonths]);

  // Totais do mês anterior ao selecionado, com os mesmos filtros, para a variação dos cards
  const previousMonthSummary = useMemo(() => {
    if (!filterMesAno) return undefined;
    const prevKey = previousMonthKey(filterMesAno);
    const items = transacoes.filter((t) => {
      if (parseMesToKey(t.mes) !== prevKey) return false;
      if (filterTipo !== "TODOS" && t.tipo !== filterTipo) return false;
      if (filterSituacao !== "TODOS" && t.situacao !== filterSituacao) return false;
      if (filterCategoria !== "TODOS" && t.categoria_id !== filterCategoria) return false;
      if (filterBanco !== "TODOS" && t.banco_id !== filterBanco) return false;
      return true;
    });
    const receita = items.filter((t) => t.tipo === "RECEITA").reduce((acc, t) => acc + Number(t.valor), 0);
    const despesa = items.filter((t) => t.tipo === "DESPESA").reduce((acc, t) => acc + Number(t.valor), 0);
    return {
      label: formatMonthShort(prevKey),
      totals: { total_receita: receita, total_despesa: despesa, total_liquido: receita - despesa },
    };
  }, [transacoes, filterMesAno, filterTipo, filterSituacao, filterCategoria, filterBanco]);

  const summaryCardsData = useMemo(() => {
    const totalReceita = periodFilteredTransacoes.filter((t) => t.tipo === "RECEITA").reduce((acc, t) => acc + Number(t.valor), 0);
    const totalDespesa = periodFilteredTransacoes.filter((t) => t.tipo === "DESPESA").reduce((acc, t) => acc + Number(t.valor), 0);
    
    return {
      total_receita: totalReceita,
      total_despesa: totalDespesa,
      total_liquido: totalReceita - totalDespesa,
      pago_receita: periodFilteredTransacoes.filter((t) => t.tipo === "RECEITA" && t.situacao === "PAGO").reduce((acc, t) => acc + Number(t.valor), 0),
      pago_despesa: periodFilteredTransacoes.filter((t) => t.tipo === "DESPESA" && t.situacao === "PAGO").reduce((acc, t) => acc + Number(t.valor), 0),
      pago_liquido: 0,
      provisao_receita: periodFilteredTransacoes.filter((t) => t.tipo === "RECEITA" && t.situacao === "PENDENTE").reduce((acc, t) => acc + Number(t.valor), 0),
      provisao_despesa: periodFilteredTransacoes.filter((t) => t.tipo === "DESPESA" && t.situacao === "PENDENTE").reduce((acc, t) => acc + Number(t.valor), 0),
      provisao_liquido: 0,
    };
  }, [periodFilteredTransacoes]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    periodFilteredTransacoes.filter(t => t.tipo === "DESPESA").forEach((t) => {
      const key = t.categoria_nome || `Categoria #${t.categoria_id}`;
      map.set(key, (map.get(key) || 0) + Number(t.valor));
    });
    const sorted = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    // Até 6 linhas: as 5 maiores e o restante somado em "Outras", para o total bater
    if (sorted.length <= 6) return sorted;
    const outras = sorted.slice(5).reduce((acc, item) => acc + item.value, 0);
    return [...sorted.slice(0, 5), { name: "Outras", value: outras }];
  }, [periodFilteredTransacoes]);

  const comparisonData = useMemo(() => [
    { name: "Receita", Pago: summaryCardsData.pago_receita, Provisao: summaryCardsData.provisao_receita },
    { name: "Despesa", Pago: summaryCardsData.pago_despesa, Provisao: summaryCardsData.provisao_despesa },
    { name: "Líquido", Pago: summaryCardsData.pago_receita - summaryCardsData.pago_despesa, Provisao: summaryCardsData.provisao_receita - summaryCardsData.provisao_despesa },
  ], [summaryCardsData]);

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [categories]);
  const sortedBanks = useMemo(() => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [banks]);

  const detailedRows = useMemo(() => {
    const direction = tableSortDirection === "asc" ? 1 : -1;
    return [...filteredTransacoes]
      .sort((a, b) => {
        if (tableSortBy === "mes") return a.mes.localeCompare(b.mes, "pt-BR") * direction;
        if (tableSortBy === "tipo") return a.tipo.localeCompare(b.tipo, "pt-BR") * direction;
        if (tableSortBy === "categoria") return (a.categoria_nome || "").localeCompare(b.categoria_nome || "", "pt-BR") * direction;
        if (tableSortBy === "banco") return (a.banco_nome || "").localeCompare(b.banco_nome || "", "pt-BR") * direction;
        if (tableSortBy === "situacao") return a.situacao.localeCompare(b.situacao, "pt-BR") * direction;
        return (Number(a.valor) - Number(b.valor)) * direction;
      })
      .slice(0, 12);
  }, [filteredTransacoes, tableSortBy, tableSortDirection]);

  if (loadingTransacoes || !filtersReady) {
    return (
      <div className="app-page py-4 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 w-full animate-pulse rounded-lg bg-neutral-200" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Dashboard"
          description="Visão consolidada de desempenho financeiro."
        />

        <DashboardFilters
          periodMonths={periodMonths} setPeriodMonths={setPeriodMonths} 
          filterMesAno={filterMesAno} setFilterMesAno={setFilterMesAno} filterAno={filterAno} setFilterAno={setFilterAno} 
          filterTipo={filterTipo} setFilterTipo={setFilterTipo} filterSituacao={filterSituacao} setFilterSituacao={setFilterSituacao} 
          filterBanco={filterBanco} setFilterBanco={setFilterBanco} filterCategoria={filterCategoria} setFilterCategoria={setFilterCategoria} 
          availableYears={availableYears} sortedBanks={sortedBanks} sortedCategories={sortedCategories}
          onClearFilters={handleClearFilters}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SummaryCards
            summary={summaryCardsData}
            previous={previousMonthSummary?.totals}
            previousLabel={previousMonthSummary?.label}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <UpcomingDues transacoes={transacoes} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <DashboardCharts
            comparisonData={comparisonData} 
            timeline={timeline} 
            summary={summaryCardsData}
            byCategory={byCategory} 
            isMobile={isMobile} 
            chartColors={chartColors} 
            getTooltipSeriesColor={getTooltipSeriesColor} 
            currency={currency} 
            hasData={periodFilteredTransacoes.length > 0}
            filterAno={filterAno} 
            filterMesAno={filterMesAno}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`transition-opacity duration-200 ${fetchingTransacoes && !loadingTransacoes ? "opacity-50" : "opacity-100"}`}
        >
          <DashboardTransactionsTable 
            detailedRows={detailedRows} tableSortBy={tableSortBy} tableSortDirection={tableSortDirection} 
            handleTableSort={handleTableSort} tipoLabel={tipoLabel}
          />
        </motion.div>
      </div>
    </div>
  );
}
