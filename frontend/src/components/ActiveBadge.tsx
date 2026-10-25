interface ActiveBadgeProps {
  ativo: boolean;
}

export default function ActiveBadge({ ativo }: ActiveBadgeProps) {
  return ativo ? (
    <span className="inline-flex items-center rounded-full bg-app-success-surface px-2.5 py-1 text-xs font-semibold leading-none text-app-success-text dark:bg-green-900/30 dark:text-green-400">
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-app-error-surface px-2.5 py-1 text-xs font-semibold leading-none text-app-error-text dark:bg-red-900/30 dark:text-red-400">
      Inativo
    </span>
  );
}
