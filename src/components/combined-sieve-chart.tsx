
"use client";

import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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
    recommendedPassing: number | null;
    upperLimit: number;
    lowerLimit: number;
  }[];
}

const chartConfig = {
  combinedPassing: {
    label: "Current Mix",
    color: "hsl(var(--primary))",
  },
  recommendedPassing: {
    label: "Recommended Blend",
    color: "hsl(140, 80%, 40%)", // A distinct green color
  },
  upperSpecLimit: {
    label: "Upper Limit",
    color: "hsl(var(--destructive) / 0.5)",
  },
  lowerSpecLimit: {
    label: "Lower Limit",
    color: "hsl(var(--destructive) / 0.5)",
  },
};

export function CombinedSieveChart({ data }: CombinedSieveChartProps) {
  const sortedData = [...data].sort((a, b) => a.sieveSize - b.sieveSize);
  const hasRecommended = sortedData.some(d => d.recommendedPassing !== null);

  return (
    <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
      <ComposedChart
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
            formatter={(value, name) => {
                const key = name as keyof typeof chartConfig | 'specLimitsUpper' | 'specLimitsLower';
                if (key === 'specLimitsUpper' || key === 'specLimitsLower') return null;
                if (!chartConfig[key as keyof typeof chartConfig]) return null;
                if (value === null) return null;
                
                let label = chartConfig[key as keyof typeof chartConfig]?.label;
                if(name === 'upperSpecLimit') label = "Upper Limit";
                if(name === 'lowerSpecLimit') label = "Lower Limit";

                return [`${(value as number).toFixed(2)}%`, label];
            }}
            labelFormatter={(label, payload) => `Sieve: ${payload?.[0]?.payload.sieveSize}mm`}
          />}
          cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 2, strokeDasharray: "3 3" }}
        />
        <Legend content={<ChartLegendContent />} />
        
        <Area 
            key="area-upper"
            type="monotone"
            dataKey="upperLimit"
            stackId="limits"
            strokeWidth={0}
            fill="hsl(var(--muted-foreground) / 0.1)"
            name="specLimitsUpper"
            legendType="none"
            tooltipType="none"
        />
         <Area 
            key="area-lower"
            type="monotone"
            dataKey="lowerLimit"
            stackId="limits"
            strokeWidth={0}
            fill="hsl(var(--muted-foreground) / 0.1)"
            name="specLimitsLower"
            legendType="none"
            tooltipType="none"
        />

        <Line
            key="line-upper"
            dataKey="upperLimit"
            type="monotone"
            stroke="hsl(var(--destructive) / 0.5)"
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={1.5}
            name="upperSpecLimit"
            legendType='line'
        />
         <Line
            key="line-lower"
            dataKey="lowerLimit"
            type="monotone"
            stroke="hsl(var(--destructive) / 0.5)"
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={1.5}
            name="lowerSpecLimit"
            legendType='line'
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
          name="combinedPassing"
        />
        {hasRecommended && (
          <Line
            type="monotone"
            dataKey="recommendedPassing"
            stroke={chartConfig.recommendedPassing.color}
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={{
              r: 4,
              fill: chartConfig.recommendedPassing.color,
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: chartConfig.recommendedPassing.color,
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
            }}
            name="recommendedPassing"
            connectNulls
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
