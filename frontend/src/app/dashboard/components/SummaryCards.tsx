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
      <div className="dashboard-summary-card-success group cursor-default p-6 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700">Total Receita</p>
            <p className="text-2xl font-bold text-green-600">
              {currency(summary.total_receita)}
            </p>
          </div>
          <div className="rounded-full bg-green-100 p-2 text-green-600 transition-colors group-hover:bg-green-200">
            <ArrowUpNarrowWide size={24} />
          </div>
        </div>
      </div>

      <div className="dashboard-summary-card-error group cursor-default p-6 transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">Total Despesa</p>
            <p className="text-2xl font-bold text-red-600">
              {currency(summary.total_despesa)}
            </p>
          </div>
          <div className="rounded-full bg-red-100 p-2 text-red-600 transition-colors group-hover:bg-red-200">
            <ArrowDownWideNarrow size={24} />
          </div>
        </div>
      </div>

      <div
        className={`group cursor-default p-6 transition-all hover:shadow-md ${
          summary.total_liquido >= 0
            ? "dashboard-summary-card-info"
            : "dashboard-summary-card-error"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-sm font-medium ${
                summary.total_liquido >= 0
                  ? "text-blue-700"
                  : "text-red-700"
              }`}
            >
              Total Líquido
            </p>
            <p
              className={`text-2xl font-bold ${
                summary.total_liquido >= 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {currency(summary.total_liquido)}
            </p>
          </div>
          <div className={`rounded-full p-2 transition-colors ${
            summary.total_liquido >= 0 
              ? "bg-blue-100 text-blue-600 group-hover:bg-blue-200" 
              : "bg-red-100 text-red-600 group-hover:bg-red-200"
          }`}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
