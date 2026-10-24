import { formatCurrency, formatSignedCurrency } from "@/utils/format";

interface MoneyValueProps {
  value: number | string;
  // Com tipo, exibe o sinal (+/−) e a cor de receita ou despesa; sem tipo, valor neutro
  tipo?: "RECEITA" | "DESPESA";
  className?: string;
}

const tipoClass: Record<"RECEITA" | "DESPESA", string> = {
  RECEITA: "text-[rgb(var(--app-status-success-text))]",
  DESPESA: "text-[rgb(var(--app-status-error-text))]",
};

export default function MoneyValue({ value, tipo, className = "" }: MoneyValueProps) {
  const text = tipo ? formatSignedCurrency(value, tipo) : formatCurrency(value);
  const colorClass = tipo ? tipoClass[tipo] : "text-[rgb(var(--app-text-primary))]";

  return (
    <span className={`whitespace-nowrap font-semibold tabular-nums ${colorClass} ${className}`.trim()}>
      {text}
    </span>
  );
}
