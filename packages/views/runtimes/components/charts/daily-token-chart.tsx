import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  type ChartConfig,
} from "@multica/ui/components/ui/chart";
import { useI18n } from "../../../i18n";
import type { DailyTokenData } from "../../utils";
import { formatTokens } from "../../utils";

type DailyTokenRow = DailyTokenData & { total: number };

function computeNiceTicks(data: DailyTokenRow[], tickCount = 5): number[] {
  const maxTotal = data.reduce(
    (max, d) => (d.total > max ? d.total : max),
    0,
  );
  if (maxTotal === 0) return [0];

  const rawStep = maxTotal / (tickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceSteps = [1, 2, 2.5, 5, 10];
  const niceStep =
    magnitude * (niceSteps.find((s) => s * magnitude >= rawStep) ?? 10);

  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    ticks.push(niceStep * i);
  }
  if ((ticks[ticks.length - 1] ?? 0) < maxTotal) {
    ticks.push(niceStep * tickCount);
  }
  return ticks;
}

function TokenTooltipContent({
  active,
  payload,
  label,
  labels,
}: {
  active?: boolean;
  payload?: Array<{ payload: DailyTokenRow }>;
  label?: string;
  labels: {
    input: string;
    output: string;
    cacheRead: string;
    cacheWrite: string;
    total: string;
  };
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;

  const items = [
    { label: labels.input, value: row.input },
    { label: labels.output, value: row.output },
    { label: labels.cacheRead, value: row.cacheRead },
    { label: labels.cacheWrite, value: row.cacheWrite },
  ];

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <div className="font-medium mb-1.5">{label}</div>
      <div className="grid gap-1">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-6"
          >
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-mono font-medium tabular-nums">
              {formatTokens(item.value)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-6 border-t pt-1 mt-0.5 font-medium">
          <span>{labels.total}</span>
          <span className="font-mono tabular-nums">
            {formatTokens(row.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DailyTokenChart({ data }: { data: DailyTokenData[] }) {
  const { t } = useI18n();
  const tokenChartConfig = {
    total: { label: t("runtimes.charts.total"), color: "var(--chart-1)" },
  } satisfies ChartConfig;
  const tooltipLabels = {
    input: t("runtimes.usage.input"),
    output: t("runtimes.usage.output"),
    cacheRead: t("runtimes.usage.cacheRead"),
    cacheWrite: t("runtimes.usage.cacheWrite"),
    total: t("runtimes.charts.total"),
  };
  const chartData = useMemo<DailyTokenRow[]>(
    () =>
      data.map((d) => ({
        ...d,
        total: d.input + d.output + d.cacheRead + d.cacheWrite,
      })),
    [data],
  );
  const ticks = useMemo(() => computeNiceTicks(chartData), [chartData]);
  const yMax = ticks[ticks.length - 1] ?? 0;

  return (
    <div className="rounded-lg border p-4">
      <h4 className="text-xs font-medium text-muted-foreground mb-3">
        {t("runtimes.charts.dailyTokens")}
      </h4>
      <ChartContainer
        config={tokenChartConfig}
        className="aspect-[2.5/1] w-full"
      >
        <AreaChart
          data={chartData}
          margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
          />
          <YAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => formatTokens(v)}
            width={65}
            domain={[0, yMax]}
            ticks={ticks}
          />
          <Tooltip content={<TokenTooltipContent labels={tooltipLabels} />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--color-total)"
            fill="var(--color-total)"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
