"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, DollarSign } from "lucide-react";
import StatCard from "@/components/StatCard";

interface SummaryTotals {
  total_receita: number;
  total_despesa: number;
  total_liquido: number;
}

interface SummaryCardsProps {
  summary: SummaryTotals;
  // Totais do mês anterior, quando um mês específico está selecionado
  previous?: SummaryTotals;
  previousLabel?: string;
}

export function SummaryCards({ summary, previous, previousLabel }: SummaryCardsProps) {
  const compare = (key: keyof SummaryTotals, higherIsBetter: boolean) =>
    previous && previousLabel
      ? { previous: previous[key], label: previousLabel, higherIsBetter }
      : undefined;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <StatCard
        title="Receitas"
        value={summary.total_receita}
        icon={ArrowUpNarrowWide}
        tone="success"
        comparison={compare("total_receita", true)}
      />
      <StatCard
        title="Despesas"
        value={summary.total_despesa}
        icon={ArrowDownWideNarrow}
        tone="error"
        comparison={compare("total_despesa", false)}
      />
      <StatCard
        title="Saldo Líquido"
        value={summary.total_liquido}
        icon={DollarSign}
        tone={summary.total_liquido >= 0 ? "info" : "error"}
        comparison={compare("total_liquido", true)}
      />
    </div>
  );
}
