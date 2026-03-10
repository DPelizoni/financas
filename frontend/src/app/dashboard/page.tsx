"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BarChart3,
  DollarSign,
  Filter,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { transacaoService } from "@/services/transacaoService";
import { categoryService } from "@/services/categoryService";
import { bankService } from "@/services/bankService";
import { Transacao, TransacaoSummary } from "@/types/transacao";
import { Category } from "@/types/category";
import { Bank } from "@/types/bank";
import FeedbackAlert from "@/components/FeedbackAlert";

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
  const currentYear = String(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [summary, setSummary] = useState<TransacaoSummary | null>(null);
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
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summaryResponse = await transacaoService.getSummary({
          search: search.trim() || undefined,
          tipo: filterTipo || undefined,
          situacao: filterSituacao || undefined,
          categoria_id: filterCategoria ? Number(filterCategoria) : undefined,
          banco_id: filterBanco ? Number(filterBanco) : undefined,
          mes: monthInputToApi(filterMesAno),
          ano: !filterMesAno && filterAno ? filterAno : undefined,
        });
        setSummary(summaryResponse);
      } catch (error) {
        console.error("Erro ao carregar resumo do dashboard:", error);
      }
    };

    loadSummary();
  }, [
    search,
    filterTipo,
    filterSituacao,
    filterCategoria,
    filterBanco,
    filterMesAno,
    filterAno,
  ]);

  const filteredTransacoes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

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

      if (normalizedSearch) {
        const searchText = [
          t.categoria_nome || "",
          t.descricao_nome || "",
          t.banco_nome || "",
          t.tipo,
          t.situacao,
          t.mes,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchText.includes(normalizedSearch)) return false;
      }

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
    search,
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

  const summaryCards = useMemo(() => {
    return {
      total_receita: summary?.total_receita || 0,
      total_despesa: summary?.total_despesa || 0,
      total_liquido: summary?.total_liquido || 0,
      pago_receita: summary?.pago_receita || 0,
      pago_despesa: summary?.pago_despesa || 0,
      pago_liquido: summary?.pago_liquido || 0,
      provisao_receita: summary?.provisao_receita || 0,
      provisao_despesa: summary?.provisao_despesa || 0,
      provisao_liquido: summary?.provisao_liquido || 0,
    };
  }, [summary]);

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
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Nova Transação
              </Link>
              <Link
                href="/banks"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Bancos
              </Link>
              <Link
                href="/categories"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Categorias
              </Link>
              <Link
                href="/descricoes"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Descrições
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter size={16} />
            Filtros Globais
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-8">
            <select
              value={periodMonths}
              onChange={(e) => setPeriodMonths(Number(e.target.value))}
              disabled={Boolean(filterMesAno)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
            </select>

            <input
              type="month"
              value={filterMesAno}
              onChange={(e) => setFilterMesAno(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              title="Mês/Ano específico"
            />

            <select
              value={filterAno}
              onChange={(e) => setFilterAno(e.target.value)}
              disabled={Boolean(filterMesAno)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Ano: todos</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={filterTipo}
              onChange={(e) =>
                setFilterTipo(e.target.value as "" | "DESPESA" | "RECEITA")
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Tipo: todos</option>
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>

            <select
              value={filterSituacao}
              onChange={(e) =>
                setFilterSituacao(e.target.value as "" | "PENDENTE" | "PAGO")
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Situação: todas</option>
              <option value="PAGO">Pago</option>
              <option value="PENDENTE">Pendente</option>
            </select>

            <select
              value={filterBanco}
              onChange={(e) =>
                setFilterBanco(e.target.value ? Number(e.target.value) : "")
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Banco: todos</option>
              {sortedBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.nome}
                </option>
              ))}
            </select>

            <select
              value={filterCategoria}
              onChange={(e) =>
                setFilterCategoria(e.target.value ? Number(e.target.value) : "")
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Categoria: todas</option>
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => {
                setFilterMesAno("");
                setFilterAno(currentYear);
                setSearch("");
                setFilterTipo("");
                setFilterSituacao("");
                setFilterCategoria("");
                setFilterBanco("");
                setPeriodMonths(12);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Limpar filtros
            </button>
          </div>
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
                      ? "text-green-600"
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
                    ? "text-green-500"
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
                    (dataMin: number) => Math.floor(dataMin * 1.2),
                    (dataMax: number) => Math.ceil(dataMax * 1.2),
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
              Evolução no Tempo e Saldo (12 meses)
            </h3>
            <div className="h-96">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/transacoes"
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <p className="text-sm font-semibold text-gray-800">Ação Rápida</p>
            <p className="mt-1 text-xs text-gray-500">Ir para transações</p>
          </Link>
          <Link
            href="/banks"
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <p className="text-sm font-semibold text-gray-800">Ação Rápida</p>
            <p className="mt-1 text-xs text-gray-500">Gerenciar bancos</p>
          </Link>
          <Link
            href="/categories"
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <p className="text-sm font-semibold text-gray-800">Ação Rápida</p>
            <p className="mt-1 text-xs text-gray-500">Gerenciar categorias</p>
          </Link>
          <Link
            href="/descricoes"
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <p className="text-sm font-semibold text-gray-800">Ação Rápida</p>
            <p className="mt-1 text-xs text-gray-500">Gerenciar descrições</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
