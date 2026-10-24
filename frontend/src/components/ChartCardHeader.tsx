import { ReactNode } from "react";

interface ChartCardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  // Cores do quadrado do ícone (fundo e texto)
  iconClassName?: string;
}

export default function ChartCardHeader({ title, subtitle, icon, iconClassName = "" }: ChartCardHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-[rgb(var(--app-text-primary))]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-[rgb(var(--app-text-muted))]">{subtitle}</p>}
      </div>
      {icon && <div className={`shrink-0 rounded-md p-2.5 ${iconClassName}`}>{icon}</div>}
    </div>
  );
}
