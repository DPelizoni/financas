const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatCurrency = (value: number | string | null | undefined): string =>
  currencyFormatter.format(Number(value || 0));

// Exibe o sinal explícito: "+R$ 10,00" para receita e "−R$ 10,00" para despesa
export const formatSignedCurrency = (
  value: number | string | null | undefined,
  tipo: "RECEITA" | "DESPESA",
): string => {
  const absolute = currencyFormatter.format(Math.abs(Number(value || 0)));
  return tipo === "DESPESA" ? `−${absolute}` : `+${absolute}`;
};

export const formatDateBR = (value: string): string => {
  if (!value) return "-";
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

// "2026-10" -> "outubro de 2026"
export const formatMonthYearLabel = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return value;
  const [, year, month] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};
