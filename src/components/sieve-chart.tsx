
"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface SieveChartProps {
  data: {
    sieveSize: number;
    percentPassing: number;
  }[];
}

const chartConfig = {
  percentPassing: {
    label: "% Passing",
    color: "hsl(var(--primary))",
  },
};

export function SieveChart({ data }: SieveChartProps) {
  const sortedData = [...data].sort((a, b) => a.sieveSize - b.sieveSize);

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <LineChart
        data={sortedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <XAxis
          dataKey="sieveSize"
          type="category"
          scale="log"
          domain={["dataMin", "dataMax"]}
          name="Sieve Size (mm)"
          tick={{ fontSize: 12 }}
          label={{ value: "Sieve Size (mm) - Log Scale", position: "insideBottom", dy: 15, fontSize: 12 }}
        />
        <YAxis
          domain={[0, 100]}
          name="% Passing"
          tickFormatter={(value) => `${value}%`}
          tick={{ fontSize: 12 }}
          label={{ value: '% Passing', angle: -90, position: 'insideLeft', dx: -10, fontSize: 12 }}
        />
        <Tooltip
          content={<ChartTooltipContent
            formatter={(value, name) => [`${(value as number).toFixed(2)}%`, chartConfig.percentPassing.label]}
            labelFormatter={(label, payload) => `Sieve: ${payload?.[0]?.payload.sieveSize}mm`}
          />}
          cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 2, strokeDasharray: "3 3" }}
        />
        <Legend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="percentPassing"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{
            r: 4,
            fill: "hsl(var(--primary))",
            stroke: "hsl(var(--background))",
            strokeWidth: 2,
          }}
          activeDot={{
            r: 6,
            fill: "hsl(var(--primary))",
            stroke: "hsl(var(--background))",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ChartContainer>
  );
}

    