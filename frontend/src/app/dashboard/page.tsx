"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Filter,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
} from "lucide-react";
import { transacaoService } from "@/services/transacaoService";
import { categoryService } from "@/services/categoryService";
import { bankService } from "@/services/bankService";
import { Transacao } from "@/types/transacao";
import { Category } from "@/types/category";
import { Bank } from "@/types/bank";
import FeedbackAlert from "@/components/FeedbackAlert";
import PageContainer from "@/components/PageContainer";
import AppButton from "@/components/AppButton";

// New Components
import { SummaryCards } from "./components/SummaryCards";
import { DashboardFilters } from "./components/DashboardFilters";
import { DashboardCharts } from "./components/DashboardCharts";
import { DashboardTransactionsTable } from "./components/DashboardTransactionsTable";

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

const situacaoLabel: Record<"PENDENTE" | "PAGO", string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
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
  const [year, month] = monthKey.split("-");
  return `${month}/${year.slice(2)}`;
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

const currency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);

export default function DashboardPage() {
  const currentYear = String(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

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
  const [filterMesAno, setFilterMesAno] = useState("");
  const [filterAno, setFilterAno] = useState<string>(currentYear);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterMesAno) count++;
    if (filterAno !== currentYear && filterAno !== "TODOS") count++;
    if (filterTipo !== "TODOS") count++;
    if (filterSituacao !== "TODOS") count++;
    if (filterCategoria !== "TODOS") count++;
    if (filterBanco !== "TODOS") count++;
    if (periodMonths !== 12 && !filterMesAno) count++;
    return count;
  }, [filterMesAno, filterAno, filterTipo, filterSituacao, filterCategoria, filterBanco, periodMonths, currentYear]);

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

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [transacoesResp, categoriesResp, banksResp] = await Promise.all([
          transacaoService.getAll({ page: 1, limit: 5000 }),
          categoryService.getAll({ page: 1, limit: 1000 }),
          bankService.getAll({ page: 1, limit: 1000 }),
        ]);
        setTransacoes(transacoesResp.data || []);
        setCategories(categoriesResp.data || []);
        setBanks(banksResp.data || []);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        setFeedback({
          type: "error",
          message: "Não foi possível carregar os dados do dashboard.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

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

  // Timeline SEMPRE completa (12 meses ou ano selecionado), ignorando o filtro de mês específico
  const timeline = useMemo(() => {
    const allMonthsSet = new Set<string>();
    transacoes.forEach((t) => {
      const month = parseMesToKey(t.mes);
      if (month) {
        // Se houver ano selecionado, filtra por ele, caso contrário, pega tudo para o slice posterior
        if (filterAno === "TODOS" || month.startsWith(`${filterAno}-`)) {
          allMonthsSet.add(month);
        }
      }
    });
    const sortedMonths = Array.from(allMonthsSet).sort();
    
    // Se estiver filtrando um mês específico, mostramos os meses que levam a ele (12 meses)
    const selectedMonths = sortedMonths.slice(-periodMonths);

    return selectedMonths.map((monthKey) => {
      // Aqui filtramos as transações apenas pelos outros critérios, mas no mês da timeline
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

  const currentMonthData = useMemo(() => {
    if (filterMesAno) {
      return timeline.find(p => p.monthKey === filterMesAno) || null;
    }
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return timeline.find(p => p.monthKey === currentKey) || (timeline.length > 0 ? timeline[timeline.length - 1] : null);
  }, [timeline, filterMesAno]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    periodFilteredTransacoes.filter(t => t.tipo === "DESPESA").forEach((t) => {
      const key = t.categoria_nome || `Categoria #${t.categoria_id}`;
      map.set(key, (map.get(key) || 0) + Number(t.valor));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
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

  if (loading) {
    return (
      <div className="app-page py-4 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <PageContainer><div className="h-10 w-64 animate-pulse rounded-md bg-gray-200" /></PageContainer>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-gray-200" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page py-4 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <PageContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                <BarChart3 size={32} className="text-blue-600 dark:text-blue-400" />
                Dashboard Executivo
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Visão consolidada de desempenho financeiro.</p>
            </div>
            <AppButton
              tone={showFilters ? "outline-primary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
              startIcon={<Filter size={18} />}
            >
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
              {activeFiltersCount > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900">{activeFiltersCount}</span>}
            </AppButton>
          </div>
        </PageContainer>

        <DashboardFilters 
          showFilters={showFilters} periodMonths={periodMonths} setPeriodMonths={setPeriodMonths} 
          filterMesAno={filterMesAno} setFilterMesAno={setFilterMesAno} filterAno={filterAno} setFilterAno={setFilterAno} 
          filterTipo={filterTipo} setFilterTipo={setFilterTipo} filterSituacao={filterSituacao} setFilterSituacao={setFilterSituacao} 
          filterBanco={filterBanco} setFilterBanco={setFilterBanco} filterCategoria={filterCategoria} setFilterCategoria={setFilterCategoria} 
          availableYears={availableYears} sortedBanks={sortedBanks} sortedCategories={sortedCategories} currentYear={currentYear}
        />

        <SummaryCards summary={summaryCardsData} currency={currency} />

        <DashboardCharts 
          comparisonData={comparisonData} timeline={timeline} currentMonthData={currentMonthData} 
          byCategory={byCategory} isMobile={isMobile} chartColors={chartColors} 
          getTooltipSeriesColor={getTooltipSeriesColor} currency={currency} hasData={periodFilteredTransacoes.length > 0}
        />

        <DashboardTransactionsTable 
          detailedRows={detailedRows} tableSortBy={tableSortBy} tableSortDirection={tableSortDirection} 
          handleTableSort={handleTableSort} tipoLabel={tipoLabel} situacaoLabel={situacaoLabel} currency={currency}
        />
      </div>
    </div>
  );
}
