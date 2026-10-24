"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarCheck, CalendarClock, ChevronRight } from "lucide-react";
import { Transacao } from "@/types/transacao";
import ChartCardHeader from "@/components/ChartCardHeader";
import CategoryIcon from "@/components/CategoryIcon";
import MoneyValue from "@/components/MoneyValue";

const DAYS_AHEAD = 7;
const MAX_ITEMS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

// Vencimento vem como DD/MM/AAAA
const parseVencimento = (value: string): Date | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || "");
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
};

const dueLabel = (days: number): { text: string; className: string } => {
  if (days < 0) {
    const ago = Math.abs(days);
    return {
      text: ago === 1 ? "Venceu ontem" : `Venceu há ${ago} dias`,
      className: "text-[rgb(var(--app-status-error-text))]",
    };
  }
  if (days === 0) return { text: "Vence hoje", className: "text-[rgb(var(--app-status-warning-text))]" };
  if (days === 1) return { text: "Vence amanhã", className: "text-[rgb(var(--app-status-warning-text))]" };
  return { text: `Vence em ${days} dias`, className: "text-[rgb(var(--app-text-muted))]" };
};

interface UpcomingDuesProps {
  transacoes: Transacao[];
}

// Pendências vencidas e dos próximos 7 dias. Não segue os filtros do Dashboard:
// o que importa aqui é a data de hoje, não o período em análise.
export function UpcomingDues({ transacoes }: UpcomingDuesProps) {
  const { items, overdueCount, total, limitLabel } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const limit = new Date(today.getTime() + DAYS_AHEAD * DAY_MS);

    const pending = transacoes
      .filter((t) => t.situacao === "PENDENTE")
      .map((t) => ({ transacao: t, date: parseVencimento(t.vencimento) }))
      .filter((item): item is { transacao: Transacao; date: Date } => item.date !== null && item.date <= limit)
      .map((item) => ({ ...item, days: Math.round((item.date.getTime() - today.getTime()) / DAY_MS) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      items: pending.slice(0, MAX_ITEMS),
      overdueCount: pending.filter((item) => item.days < 0).length,
      total: pending.length,
      limitLabel: limit.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    };
  }, [transacoes]);

  const subtitle =
    total === 0
      ? `Pendências até ${limitLabel}`
      : [
          overdueCount > 0 ? `${overdueCount} ${overdueCount === 1 ? "vencida" : "vencidas"}` : null,
          total - overdueCount > 0 ? `${total - overdueCount} até ${limitLabel}` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="app-surface p-6">
      <ChartCardHeader
        title="Próximos vencimentos"
        subtitle={subtitle}
        icon={<CalendarClock size={20} />}
        iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
      />

      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-[rgb(var(--app-border-default))] px-4 py-6 text-sm text-[rgb(var(--app-text-muted))]">
          <CalendarCheck size={20} className="shrink-0 text-[rgb(var(--app-status-success-text))]" />
          Nenhuma pendência vencida ou vencendo nos próximos {DAYS_AHEAD} dias.
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            {items.map(({ transacao: t, days }) => {
              const due = dueLabel(days);
              return (
                <li key={t.id} className="flex items-center gap-3 border-b border-[rgb(var(--app-border-subtle))] py-3">
                  <CategoryIcon nome={t.categoria_nome || ""} tipo={t.tipo} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[rgb(var(--app-text-primary))]" title={t.descricao_nome}>
                      {t.descricao_nome || "Sem descrição"}
                    </p>
                    <p className="truncate text-xs text-[rgb(var(--app-text-muted))]">
                      <span className={due.className}>{due.text}</span>
                      {` · ${t.vencimento.slice(0, 5)}`}
                      {t.banco_nome ? ` · ${t.banco_nome}` : ""}
                    </p>
                  </div>
                  <MoneyValue value={t.valor} tipo={t.tipo} className="text-sm" />
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center justify-between gap-4 text-sm">
            <span className="text-[rgb(var(--app-text-muted))]">
              {total > items.length ? `Mostrando ${items.length} de ${total}` : ""}
            </span>
            <Link
              href="/transacoes?mes=todos&situacao=PENDENTE"
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Ver pendentes em Transações
              <ChevronRight size={16} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
