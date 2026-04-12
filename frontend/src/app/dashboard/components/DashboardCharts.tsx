import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyPoint {
  monthKey: string;
  monthLabel: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface DashboardChartsProps {
  comparisonData: any[];
  timeline: MonthlyPoint[];
  byCategory: any[];
  isMobile: boolean;
  chartColors: any;
  getTooltipSeriesColor: (seriesName: string) => string;
  currency: (value: number) => string;
  hasData: boolean;
}

export function DashboardCharts({
  comparisonData,
  timeline,
  byCategory,
  isMobile,
  chartColors,
  getTooltipSeriesColor,
  currency,
  hasData,
}: DashboardChartsProps) {
  const hasSingleTimelineMonth = timeline.length === 1;
  const singleMonthDonutData = hasSingleTimelineMonth
    ? [
        {
          indicador: "Receita",
          valor: timeline[0].receitas,
          fill: chartColors.receitas,
        },
        {
          indicador: "Despesa",
          valor: timeline[0].despesas,
          fill: chartColors.despesas,
        },
      ]
    : [];

  const singleMonthSaldo = hasSingleTimelineMonth ? timeline[0].saldo : 0;
  const singleMonthTotal = hasSingleTimelineMonth
    ? timeline[0].receitas + timeline[0].despesas
    : 0;
  
  const donutInnerRadius = isMobile ? 44 : 55;
  const donutOuterRadius = isMobile ? 70 : 88;

  const tooltipContentStyle = {
    backgroundColor: "rgb(var(--app-bg-surface))",
    border: "1px solid rgb(var(--app-border-default))",
    borderRadius: 8,
    color: "rgb(var(--app-text-primary))",
  };
  const tooltipLabelStyle = {
    color: "rgb(var(--app-text-secondary))",
  };
  const tooltipItemStyle = {
    color: "rgb(var(--app-text-primary))",
  };
  const tooltipCursor = {
    fill: "rgb(var(--app-neutral-300) / 0.24)",
  };

  const receitaPercent =
    singleMonthTotal > 0
      ? Math.round((timeline[0].receitas / singleMonthTotal) * 100)
      : 0;
  const despesaPercent =
    singleMonthTotal > 0
      ? Math.round((timeline[0].despesas / singleMonthTotal) * 100)
      : 0;

  const renderDonutPercentLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
  }: any) => {
    const safePercent = Number(percent || 0);
    if (safePercent <= 0) return null;

    const centerX = Number(cx);
    const centerY = Number(cy);
    const radius = Number(outerRadius) + 16;
    const angle = (-Number(midAngle) * Math.PI) / 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const labelColor =
      name === "Receita" ? chartColors.receitas : chartColors.despesas;

    return (
      <text
        x={x}
        y={y}
        fill={labelColor}
        textAnchor={x >= centerX ? "start" : "end"}
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
      >
        {`${Math.round(safePercent * 100)}%`}
      </text>
    );
  };

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="app-surface p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Comparativo: Pago vs Provisão
          </h3>
          <div className="flex h-80 flex-col items-center justify-center text-center">
            <BarChart3 size={48} className="mb-2 text-gray-200" />
            <p className="text-sm text-gray-500">Sem dados para o comparativo de pagamentos.</p>
          </div>
        </div>
        <div className="app-surface p-4">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Evolução Temporal e Saldo</h3>
            <div className="flex h-96 flex-col items-center justify-center text-center">
                <BarChart3 size={48} className="mb-2 text-gray-200" />
                <p className="text-sm text-gray-500">Sem movimentações no período selecionado.</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="app-surface p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Comparativo: Pago vs Provisão
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} barGap={4} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis
                hide
                domain={[
                  (dataMin: number) =>
                    dataMin >= 0 ? 0 : Math.floor(dataMin * 1.2),
                  (dataMax: number) =>
                    dataMax <= 0 ? 0 : Math.ceil(dataMax * 1.2),
                ]}
              />
              <Tooltip
                formatter={(v, name) => (
                  <span
                    style={{
                      color: getTooltipSeriesColor(String(name)),
                      fontWeight: 700,
                    }}
                  >
                    {currency(Number(v || 0))}
                  </span>
                )}
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={tooltipCursor}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="Pago"
                fill={chartColors.pago}
                radius={[6, 6, 0, 0]}
              >
                {!isMobile && (
                  <LabelList
                    dataKey="Pago"
                    position="top"
                    formatter={(value: any) => currency(Number(value))}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      fill: chartColors.pago,
                    }}
                  />
                )}
              </Bar>
              <Bar
                dataKey="Provisao"
                name="Provisão"
                fill={chartColors.pendente}
                radius={[6, 6, 0, 0]}
              >
                {!isMobile && (
                  <LabelList
                    dataKey="Provisao"
                    position="top"
                    formatter={(value: any) => currency(Number(value))}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      fill: chartColors.pendente,
                    }}
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <div className="app-surface p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            {hasSingleTimelineMonth
              ? "Resumo Mensal Detalhado"
              : "Evolução Temporal e Saldo"}
          </h3>
          <div className="h-[520px] sm:h-96">
            {hasSingleTimelineMonth ? (
              <div className="grid h-full grid-cols-1 gap-4 lg:auto-rows-fr lg:grid-cols-2">
                <div className="h-full">
                  <div className="dashboard-summary-card-neutral flex h-full flex-col p-3">
                    <div className="h-[70%]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={singleMonthDonutData}
                            dataKey="valor"
                            nameKey="indicador"
                            cx="50%"
                            cy="50%"
                            innerRadius={donutInnerRadius}
                            outerRadius={donutOuterRadius}
                            paddingAngle={3}
                            labelLine={false}
                            label={
                              isMobile ? false : renderDonutPercentLabel
                            }
                          >
                            {singleMonthDonutData.map((entry) => (
                              <Cell key={entry.indicador} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v, name) => {
                              const total =
                                (timeline[0]?.receitas || 0) +
                                (timeline[0]?.despesas || 0);
                              const value = Number(v || 0);
                              const percent =
                                total > 0 ? (value / total) * 100 : 0;
                              return (
                                <span
                                  style={{
                                    color: getTooltipSeriesColor(String(name)),
                                    fontWeight: 700,
                                  }}
                                >
                                  {`${currency(value)} (${Math.round(percent)}%)`}
                                </span>
                              );
                            }}
                            contentStyle={tooltipContentStyle}
                            labelStyle={tooltipLabelStyle}
                            itemStyle={tooltipItemStyle}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-700">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: chartColors.receitas }}
                          />
                          Receita
                        </span>
                        <span className="inline-block min-w-[145px] text-right tabular-nums sm:min-w-[170px]">
                          <span style={{ color: chartColors.receitas }}>
                            {currency(timeline[0].receitas)}
                          </span>{" "}
                          <span
                            className="font-bold"
                            style={{ color: chartColors.receitas }}
                          >
                            ({receitaPercent}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-700">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: chartColors.despesas }}
                          />
                          Despesa
                        </span>
                        <span className="inline-block min-w-[145px] text-right tabular-nums sm:min-w-[170px]">
                          <span style={{ color: chartColors.despesas }}>
                            {currency(timeline[0].despesas)}
                          </span>{" "}
                          <span
                            className="font-bold"
                            style={{ color: chartColors.despesas }}
                          >
                            ({despesaPercent}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-full">
                  <div
                    className={`flex h-full items-center justify-center p-3 ${
                      singleMonthSaldo >= 0
                        ? "dashboard-summary-card-info"
                        : "dashboard-summary-card-error"
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        Líquido
                      </p>
                      <p
                        className={`mt-2 text-3xl font-bold ${
                          singleMonthSaldo >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      >
                        {currency(singleMonthSaldo)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeline}
                  margin={{ top: 30, right: 28, left: 20, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10 }}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v, name) => (
                      <span
                        style={{
                          color: getTooltipSeriesColor(String(name)),
                          fontWeight: 700,
                        }}
                      >
                        {currency(Number(v || 0))}
                      </span>
                    )}
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={tooltipCursor}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    name="Receitas"
                    stroke={chartColors.receitas}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    name="Despesas"
                    stroke={chartColors.despesas}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke={chartColors.saldo}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  >
                    {!isMobile && (
                      <LabelList
                        dataKey="saldo"
                        position="top"
                        formatter={(value: any) => currency(Number(value))}
                        style={{
                          fontSize: 8,
                          fill: chartColors.saldo,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="app-surface p-4">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Gastos por Categoria
          </h3>
          <div className="h-72">
            {byCategory.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <BarChart3 size={48} className="mb-2 text-gray-200" />
                <p className="text-sm text-gray-500">Nenhuma categoria registrada nestas transações.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis
                    hide
                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                  />
                  <Tooltip
                    formatter={(v, _name, item) => {
                      const itemColor =
                        typeof (item as { color?: unknown })?.color === "string"
                          ? ((item as { color?: string }).color as string)
                          : chartColors.saldo;

                      return [
                        <span
                          style={{
                            color: itemColor,
                            fontWeight: 700,
                          }}
                        >
                          {currency(Number(v || 0))}
                        </span>,
                        "Total",
                      ];
                    }}
                    labelFormatter={(label) => `Categoria: ${label}`}
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={tooltipCursor}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {byCategory.map((_, index) => {
                      const colors = [
                        chartColors.pieA,
                        chartColors.pieB,
                        chartColors.pieC,
                        chartColors.pieD,
                        chartColors.pieE,
                      ];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                    {!isMobile && (
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(value: any) => currency(Number(value))}
                        style={{ fontSize: 10, fontWeight: 600 }}
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
