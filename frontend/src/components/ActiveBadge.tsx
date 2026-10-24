interface ActiveBadgeProps {
  ativo: boolean;
}

export default function ActiveBadge({ ativo }: ActiveBadgeProps) {
  return ativo ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold leading-none text-green-800 dark:bg-green-900/30 dark:text-green-400">
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold leading-none text-red-800 dark:bg-red-900/30 dark:text-red-400">
      Inativo
    </span>
  );
}
