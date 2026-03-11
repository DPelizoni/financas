"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BarChart3,
  DollarSign,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { transacaoService } from "@/services/transacaoService";
import { categoryService } from "@/services/categoryService";
import { bankService } from "@/services/bankService";
import { Transacao } from "@/types/transacao";
import { Category } from "@/types/category";
import { Bank } from "@/types/bank";
import FeedbackAlert from "@/components/FeedbackAlert";
import {
  getTransactionSectionClasses,
  TransactionSection,
  TransactionSectionLabel,
} from "@/components/TransactionSection";

interface MonthlyPoint {
  monthKey: string;
  monthLabel: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

const chartColors = {
  receitas: "#10b981",
  despesas: "#ef4444",
  saldo: "#0ea5e9",
  pendente: "#f59e0b",
  pago: "#22c55e",
  pieA: "#3b82f6",
  pieB: "#10b981",
  pieC: "#f59e0b",
  pieD: "#8b5cf6",
  pieE: "#ef4444",
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

const monthInputToApi = (monthInput: string): string | undefined => {
  if (!monthInput) return undefined;
  const [year, month] = monthInput.split("-");
  if (!year || !month) return undefined;
  return `${month}/${year}`;
};

const currency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);

export default function DashboardPage() {
  const filterSectionClasses = getTransactionSectionClasses("gray");
  const currentYear = String(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  // Filtros globais
  const [periodMonths, setPeriodMonths] = useState(12);
  const [filterTipo, setFilterTipo] = useState<"" | "DESPESA" | "RECEITA">("");
  const [filterSituacao, setFilterSituacao] = useState<
    "" | "PENDENTE" | "PAGO"
  >("");
  const [filterCategoria, setFilterCategoria] = useState<number | "">("");
  const [filterBanco, setFilterBanco] = useState<number | "">("");
  const [filterMesAno, setFilterMesAno] = useState("");
  const [filterAno, setFilterAno] = useState(currentYear);
  const [tableSortBy, setTableSortBy] = useState<
    "mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor"
  >("mes");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">(
    "asc",
  );

  const handleTableSort = (
    column: "mes" | "tipo" | "categoria" | "banco" | "situacao" | "valor",
  ) => {
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
          message:
            "Não foi possível carregar os dados do dashboard. Verifique a conexão com a API.",
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

      if (filterTipo && t.tipo !== filterTipo) return false;
      if (filterSituacao && t.situacao !== filterSituacao) return false;
      if (filterCategoria && t.categoria_id !== filterCategoria) return false;
      if (filterBanco && t.banco_id !== filterBanco) return false;
      if (filterMesAno && mesKey !== filterMesAno) return false;
      if (filterAno && !filterMesAno && !mesKey.startsWith(`${filterAno}-`))
        return false;

      return true;
    });
  }, [
    transacoes,
    filterTipo,
    filterSituacao,
    filterCategoria,
    filterBanco,
    filterMesAno,
    filterAno,
  ]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentYear);
    transacoes.forEach((t) => {
      const key = parseMesToKey(t.mes);
      if (!key) return;
      years.add(key.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transacoes, currentYear]);

  const timeline = useMemo(() => {
    const allMonthsSet = new Set<string>();

    filteredTransacoes.forEach((t) => {
      const month = parseMesToKey(t.mes);
      if (month) allMonthsSet.add(month);
    });

    const sortedMonths = Array.from(allMonthsSet).sort();
    const selectedMonths = sortedMonths.slice(-periodMonths);

    const points: MonthlyPoint[] = selectedMonths.map((monthKey) => {
      const monthItems = filteredTransacoes.filter(
        (t) => parseMesToKey(t.mes) === monthKey,
      );

      const receitas = monthItems
        .filter((t) => t.tipo === "RECEITA")
        .reduce((acc, t) => acc + Number(t.valor), 0);

      const despesas = monthItems
        .filter((t) => t.tipo === "DESPESA")
        .reduce((acc, t) => acc + Number(t.valor), 0);

      return {
        monthKey,
        monthLabel: monthLabel(monthKey),
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });

    return points;
  }, [filteredTransacoes, periodMonths]);

  const periodFilteredTransacoes = useMemo(() => {
    if (filterMesAno) {
      return filteredTransacoes;
    }

    const months = Array.from(
      new Set(
        filteredTransacoes
          .map((t) => parseMesToKey(t.mes))
          .filter((m): m is string => Boolean(m)),
      ),
    )
      .sort()
      .slice(-periodMonths);

    const selectedMonths = new Set(months);

    return filteredTransacoes.filter((t) => {
      const key = parseMesToKey(t.mes);
      return key ? selectedMonths.has(key) : false;
    });
  }, [filteredTransacoes, filterMesAno, periodMonths]);

  const summaryCards = useMemo(() => {
    const totalReceita = periodFilteredTransacoes
      .filter((t) => t.tipo === "RECEITA")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const totalDespesa = periodFilteredTransacoes
      .filter((t) => t.tipo === "DESPESA")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const pagoReceita = periodFilteredTransacoes
      .filter((t) => t.tipo === "RECEITA" && t.situacao === "PAGO")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const pagoDespesa = periodFilteredTransacoes
      .filter((t) => t.tipo === "DESPESA" && t.situacao === "PAGO")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const provisaoReceita = periodFilteredTransacoes
      .filter((t) => t.tipo === "RECEITA" && t.situacao === "PENDENTE")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const provisaoDespesa = periodFilteredTransacoes
      .filter((t) => t.tipo === "DESPESA" && t.situacao === "PENDENTE")
      .reduce((acc, t) => acc + Number(t.valor), 0);

    return {
      total_receita: totalReceita,
      total_despesa: totalDespesa,
      total_liquido: totalReceita - totalDespesa,
      pago_receita: pagoReceita,
      pago_despesa: pagoDespesa,
      pago_liquido: pagoReceita - pagoDespesa,
      provisao_receita: provisaoReceita,
      provisao_despesa: provisaoDespesa,
      provisao_liquido: provisaoReceita - provisaoDespesa,
    };
  }, [periodFilteredTransacoes]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();

    filteredTransacoes.forEach((t) => {
      const key = t.categoria_nome || `Categoria #${t.categoria_id}`;
      map.set(key, (map.get(key) || 0) + Number(t.valor));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredTransacoes]);

  const comparisonData = useMemo(
    () => [
      {
        name: "Receita",
        Pago: summaryCards.pago_receita,
        Provisão: summaryCards.provisao_receita,
      },
      {
        name: "Despesa",
        Pago: summaryCards.pago_despesa,
        Provisão: summaryCards.provisao_despesa,
      },
      {
        name: "Líquido",
        Pago: summaryCards.pago_liquido,
        Provisão: summaryCards.provisao_liquido,
      },
    ],
    [summaryCards],
  );

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [categories],
  );

  const sortedBanks = useMemo(
    () => [...banks].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [banks],
  );

  const detailedRows = useMemo(() => {
    const direction = tableSortDirection === "asc" ? 1 : -1;
    return [...filteredTransacoes]
      .sort((a, b) => {
        if (tableSortBy === "mes")
          return a.mes.localeCompare(b.mes, "pt-BR") * direction;
        if (tableSortBy === "tipo")
          return a.tipo.localeCompare(b.tipo, "pt-BR") * direction;
        if (tableSortBy === "categoria")
          return (
            (a.categoria_nome || "").localeCompare(
              b.categoria_nome || "",
              "pt-BR",
            ) * direction
          );
        if (tableSortBy === "banco")
          return (
            (a.banco_nome || "").localeCompare(b.banco_nome || "", "pt-BR") *
            direction
          );
        if (tableSortBy === "situacao")
          return a.situacao.localeCompare(b.situacao, "pt-BR") * direction;
        return (Number(a.valor) - Number(b.valor)) * direction;
      })
      .slice(0, 12);
  }, [filteredTransacoes, tableSortBy, tableSortDirection]);

  const hasSingleTimelineMonth = timeline.length === 1;
  const singleMonthDonutData = hasSingleTimelineMonth
    ? [
        {
          indicador: "Receita",
          valor: timeline[0].receitas,
          fill: chartColors.receitas,
        },
        {
          indicador: "Despesa",
          valor: timeline[0].despesas,
          fill: chartColors.despesas,
        },
      ]
    : [];

  const singleMonthSaldo = hasSingleTimelineMonth ? timeline[0].saldo : 0;

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                <BarChart3 size={32} className="text-blue-600" />
                Dashboard Executivo
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Visão consolidada de desempenho financeiro com indicadores e
                análises.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/transacoes"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Transação
              </Link>
              <Link
                href="/banks"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Bancos
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Categorias
              </Link>
              <Link
                href="/descricoes"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Descrições
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <TransactionSection title="Filtros Globais" tone="gray">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <TransactionSectionLabel tone="gray">
                  Período
                </TransactionSectionLabel>
                <select
                  value={periodMonths}
                  onChange={(e) => setPeriodMonths(Number(e.target.value))}
                  disabled={Boolean(filterMesAno)}
                  className={`${filterSectionClasses.input} disabled:bg-gray-100 disabled:text-gray-500`}
                >
                  <option value={3}>Últimos 3 meses</option>
                  <option value={6}>Últimos 6 meses</option>
                  <option value={12}>Últimos 12 meses</option>
                </select>
              </div>

              <div>
                <TransactionSectionLabel tone="gray">
                  Mês/Ano
                </TransactionSectionLabel>
                <input
                  type="month"
                  value={filterMesAno}
                  onChange={(e) => setFilterMesAno(e.target.value)}
                  className={filterSectionClasses.input}
                  title="Mês/Ano específico"
                />
              </div>

              <div>
                <TransactionSectionLabel tone="gray">
                  Ano
                </TransactionSectionLabel>
                <select
                  value={filterAno}
                  onChange={(e) => setFilterAno(e.target.value)}
                  disabled={Boolean(filterMesAno)}
                  className={`${filterSectionClasses.input} disabled:bg-gray-100 disabled:text-gray-500`}
                >
                  <option value="">Todos</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <TransactionSectionLabel tone="gray">
                  Tipo
                </TransactionSectionLabel>
                <select
                  value={filterTipo}
                  onChange={(e) =>
                    setFilterTipo(e.target.value as "" | "DESPESA" | "RECEITA")
                  }
                  className={filterSectionClasses.input}
                >
                  <option value="">Todos</option>
                  <option value="DESPESA">Despesa</option>
                  <option value="RECEITA">Receita</option>
                </select>
              </div>

              <div>
                <TransactionSectionLabel tone="gray">
                  Situação
                </TransactionSectionLabel>
                <select
                  value={filterSituacao}
                  onChange={(e) =>
                    setFilterSituacao(
                      e.target.value as "" | "PENDENTE" | "PAGO",
                    )
                  }
                  className={filterSectionClasses.input}
                >
                  <option value="">Todas</option>
                  <option value="PAGO">Pago</option>
                  <option value="PENDENTE">Pendente</option>
                </select>
              </div>

              <div>
                <TransactionSectionLabel tone="gray">
                  Banco
                </TransactionSectionLabel>
                <select
                  value={filterBanco}
                  onChange={(e) =>
                    setFilterBanco(e.target.value ? Number(e.target.value) : "")
                  }
                  className={filterSectionClasses.input}
                >
                  <option value="">Todos</option>
                  {sortedBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <TransactionSectionLabel tone="gray">
                  Categoria
                </TransactionSectionLabel>
                <select
                  value={filterCategoria}
                  onChange={(e) =>
                    setFilterCategoria(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className={filterSectionClasses.input}
                >
                  <option value="">Todas</option>
                  {sortedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMesAno("");
                    setFilterAno(currentYear);
                    setFilterTipo("");
                    setFilterSituacao("");
                    setFilterCategoria("");
                    setFilterBanco("");
                    setPeriodMonths(12);
                  }}
                  className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </TransactionSection>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Receita</p>
                <p className="text-2xl font-bold text-green-600">
                  {currency(summaryCards.total_receita)}
                </p>
              </div>
              <ArrowLeftRight size={30} className="text-green-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Despesa</p>
                <p className="text-2xl font-bold text-red-600">
                  {currency(summaryCards.total_despesa)}
                </p>
              </div>
              <ArrowLeftRight size={30} className="text-red-500" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Líquido</p>
                <p
                  className={`text-2xl font-bold ${
                    summaryCards.total_liquido >= 0
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {currency(summaryCards.total_liquido)}
                </p>
              </div>
              <DollarSign
                size={30}
                className={
                  summaryCards.total_liquido >= 0
                    ? "text-blue-500"
                    : "text-red-500"
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Comparativo: Pago vs Provisão
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis
                  hide
                  domain={[
                    (dataMin: number) =>
                      dataMin >= 0 ? 0 : Math.floor(dataMin * 1.2),
                    (dataMax: number) =>
                      dataMax <= 0 ? 0 : Math.ceil(dataMax * 1.2),
                  ]}
                />
                <Tooltip formatter={(v) => currency(Number(v || 0))} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="Pago"
                  fill={chartColors.pago}
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList
                    dataKey="Pago"
                    position="top"
                    formatter={(value: any) => currency(Number(value))}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      fill: chartColors.pago,
                    }}
                  />
                </Bar>
                <Bar
                  dataKey="Provisão"
                  fill={chartColors.pendente}
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList
                    dataKey="Provisão"
                    position="top"
                    formatter={(value: any) => currency(Number(value))}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      fill: chartColors.pendente,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              {hasSingleTimelineMonth
                ? "Resumo Mensal"
                : "Evolução no Tempo e Saldo (12 meses)"}
            </h3>
            <div className="h-96">
              {hasSingleTimelineMonth ? (
                <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="h-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
                    <div className="h-[70%]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={singleMonthDonutData}
                            dataKey="valor"
                            nameKey="indicador"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={88}
                            paddingAngle={3}
                          >
                            {singleMonthDonutData.map((entry) => (
                              <Cell key={entry.indicador} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v) => currency(Number(v || 0))}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          🟢 Receita
                        </span>
                        <span className="font-semibold text-green-600">
                          {currency(timeline[0].receitas)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          🔴 Despesa
                        </span>
                        <span className="font-semibold text-red-600">
                          {currency(timeline[0].despesas)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-3">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        Líquido
                      </p>
                      <p
                        className={`mt-2 text-3xl font-bold ${
                          singleMonthSaldo >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {currency(singleMonthSaldo)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeline}
                    margin={{ top: 30, right: 28, left: 20, bottom: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 10 }}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis hide />
                    <Tooltip formatter={(v) => currency(Number(v || 0))} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="receitas"
                      stroke={chartColors.receitas}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="despesas"
                      stroke={chartColors.despesas}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke={chartColors.saldo}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    >
                      <LabelList
                        dataKey="saldo"
                        position="top"
                        formatter={(value: any) => currency(Number(value))}
                        style={{
                          fontSize: 8,
                          fill: chartColors.saldo,
                          fontWeight: 600,
                        }}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Comparativo por Categoria (Barras)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis
                    hide
                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip formatter={(v) => currency(Number(v || 0))} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {byCategory.map((_, index) => {
                      const colors = [
                        chartColors.pieA,
                        chartColors.pieB,
                        chartColors.pieC,
                        chartColors.pieD,
                        chartColors.pieE,
                      ];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(value: any) => currency(Number(value))}
                      style={{ fontSize: 10, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Dados Detalhados
            </h3>
            <span className="text-xs text-gray-500">
              Registros filtrados exibidos: {detailedRows.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleTableSort("mes")}
                      className="inline-flex items-center gap-1"
                    >
                      Mês
                      {tableSortBy === "mes" && tableSortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : tableSortBy === "mes" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleTableSort("tipo")}
                      className="inline-flex items-center gap-1"
                    >
                      Tipo
                      {tableSortBy === "tipo" &&
                      tableSortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : tableSortBy === "tipo" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleTableSort("categoria")}
                      className="inline-flex items-center gap-1"
                    >
                      Categoria
                      {tableSortBy === "categoria" &&
                      tableSortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : tableSortBy === "categoria" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleTableSort("banco")}
                      className="inline-flex items-center gap-1"
                    >
                      Banco
                      {tableSortBy === "banco" &&
                      tableSortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : tableSortBy === "banco" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleTableSort("situacao")}
                      className="inline-flex items-center gap-1"
                    >
                      Situação
                      {tableSortBy === "situacao" &&
                      tableSortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : tableSortBy === "situacao" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleTableSort("valor")}
                      className="inline-flex items-center gap-1"
                    >
                      Valor
                      {tableSortBy === "valor" &&
                      tableSortDirection === "asc" ? (
                        <ChevronUp size={14} />
                      ) : tableSortBy === "valor" ? (
                        <ChevronDown size={14} />
                      ) : null}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {detailedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      Nenhum registro encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  detailedRows.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {t.mes}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            t.tipo === "RECEITA"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {t.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {t.categoria_nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {t.banco_nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            t.situacao === "PAGO"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {t.situacao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {currency(Number(t.valor))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
