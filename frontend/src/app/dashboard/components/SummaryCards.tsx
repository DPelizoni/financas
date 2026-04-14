import { ArrowDownWideNarrow, ArrowUpNarrowWide, DollarSign } from "lucide-react";

interface SummaryCardsProps {
  summary: {
    total_receita: number;
    total_despesa: number;
    total_liquido: number;
  };
  currency: (value: number) => string;
}

export function SummaryCards({ summary, currency }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="dashboard-summary-card-success group cursor-default p-6 transition-all hover:bg-green-50/50 dark:hover:bg-green-900/10 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Total Receita</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-300">
              {currency(summary.total_receita)}
            </p>
          </div>
          <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-2 text-green-600 dark:text-green-400 transition-colors group-hover:bg-green-200 dark:group-hover:bg-green-800/60">
            <ArrowUpNarrowWide size={24} />
          </div>
        </div>
      </div>

      <div className="dashboard-summary-card-error group cursor-default p-6 transition-all hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Total Despesa</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-300">
              {currency(summary.total_despesa)}
            </p>
          </div>
          <div className="rounded-full bg-red-100 dark:bg-red-900/40 p-2 text-red-600 dark:text-red-400 transition-colors group-hover:bg-red-200 dark:group-hover:bg-red-800/60">
            <ArrowDownWideNarrow size={24} />
          </div>
        </div>
      </div>

      <div
        className={`group cursor-default p-6 transition-all hover:shadow-md ${
          summary.total_liquido >= 0
            ? "dashboard-summary-card-info hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            : "dashboard-summary-card-error hover:bg-red-50/50 dark:hover:bg-red-900/10"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-sm font-medium ${
                summary.total_liquido >= 0
                  ? "text-blue-700 dark:text-blue-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              Total Líquido
            </p>
            <p
              className={`text-2xl font-bold ${
                summary.total_liquido >= 0
                  ? "text-blue-600 dark:text-blue-300"
                  : "text-red-600 dark:text-red-300"
              }`}
            >
              {currency(summary.total_liquido)}
            </p>
          </div>
          <div className={`rounded-full p-2 transition-colors ${
            summary.total_liquido >= 0 
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60" 
              : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-800/60"
          }`}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
