import { CheckCircle2, Clock } from "lucide-react";

type Situacao = "PAGO" | "PENDENTE";

interface SituacaoBadgeProps {
  situacao: Situacao;
  // Quando informado, a tag vira um botão que alterna a situação
  onToggle?: () => void;
  disabled?: boolean;
}

const config: Record<Situacao, { label: string; classes: string; nextLabel: string }> = {
  PAGO: {
    label: "Pago",
    classes:
      "border-green-200 bg-green-100 text-green-700 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-400",
    nextLabel: "pendente",
  },
  PENDENTE: {
    label: "Pendente",
    classes:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-400",
    nextLabel: "pago",
  },
};

const baseClasses =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none";

export default function SituacaoBadge({ situacao, onToggle, disabled = false }: SituacaoBadgeProps) {
  const { label, classes, nextLabel } = config[situacao];
  const Icon = situacao === "PAGO" ? CheckCircle2 : Clock;
  const content = (
    <>
      <Icon size={12} aria-hidden="true" />
      {label}
    </>
  );

  if (!onToggle) {
    return <span className={`${baseClasses} ${classes}`}>{content}</span>;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={`Marcar como ${nextLabel}`}
      aria-label={`${label}. Marcar como ${nextLabel}`}
      className={`${baseClasses} ${classes} transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-focus-ring))] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:brightness-125`}
    >
      {content}
    </button>
  );
}
