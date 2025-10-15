
"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  ComposedChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface CombinedSieveChartProps {
  data: {
    sieveSize: number;
    combinedPassing: number;
    upperLimit: number;
    lowerLimit: number;
  }[];
}

const chartConfig = {
  combinedPassing: {
    label: "Combined Gradation",
    color: "hsl(var(--primary))",
  },
  specLimits: {
    label: "Specification Limits",
    color: "hsl(var(--muted-foreground) / 0.5)",
  },
  upperLimit: {
    label: "Upper Limit",
    color: "hsl(var(--destructive) / 0.5)",
  },
  lowerLimit: {
    label: "Lower Limit",
    color: "hsl(var(--destructive) / 0.5)",
  },
};

export function CombinedSieveChart({ data }: CombinedSieveChartProps) {

  return (
    <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
      <ComposedChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
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
            formatter={(value, name) => {
              if (name === 'specLimits') return null;
              return [`${(value as number).toFixed(2)}%`, chartConfig[name as keyof typeof chartConfig]?.label]
            }}
            labelFormatter={(label, payload) => `Sieve: ${payload?.[0]?.payload.sieveSize}mm`}
          />}
          cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 2, strokeDasharray: "3 3" }}
        />
        <Legend content={<ChartLegendContent />} />
        
        <Area 
            type="monotone"
            dataKey="upperLimit"
            stackId="1"
            stroke="0"
            fill="hsl(var(--muted-foreground) / 0.2)"
            name="specLimits"
            tooltipType="none"
            legendType="none"
        />
         <Area 
            type="monotone"
            dataKey="lowerLimit"
            stackId="1"
            stroke="0"
            fill="hsl(var(--muted-foreground) / 0.2)"
            name="specLimits"
            tooltipType="none"
            legendType="none"
        />

        <Line
            dataKey="upperLimit"
            type="monotone"
            stroke="hsl(var(--destructive) / 0.5)"
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={1.5}
            name="Upper Limit"
            legendType='none'
        />
         <Line
            dataKey="lowerLimit"
            type="monotone"
            stroke="hsl(var(--destructive) / 0.5)"
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={1.5}
            name="Lower Limit"
            legendType='none'
        />

        <Line
          type="monotone"
          dataKey="combinedPassing"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
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
          name="Combined Gradation"
        />
      </ComposedChart>
    </ChartContainer>
  );
}
