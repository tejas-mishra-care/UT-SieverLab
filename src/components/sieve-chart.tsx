
"use client";

import {
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  DotProps,
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
  specLimits: Record<number, { min: number; max: number }> | null;
}

const chartConfig = {
  percentPassing: {
    label: "% Passing",
    color: "hsl(var(--primary))",
  },
  specLimits: { 
    label: 'Specification Limits', 
    color: 'hsl(var(--muted-foreground) / 0.5)'
  },
};

const CustomDot = (props: DotProps & { payload: any, specLimits: Record<number, { min: number, max: number }> | null }) => {
    const { cx, cy, payload, value, specLimits } = props;
    const limits = specLimits ? specLimits[payload.sieveSize] : null;

    if (limits && (value > limits.max || value < limits.min)) {
        return <circle cx={cx} cy={cy} r={5} strokeWidth={2} fill="hsl(var(--destructive))" stroke="hsl(var(--background))" />;
    }

    return <circle cx={cx} cy={cy} r={4} strokeWidth={2} fill="hsl(var(--primary))" stroke="hsl(var(--background))" />;
};


export function SieveChart({ data, specLimits }: SieveChartProps) {
  const sortedData = [...data].sort((a, b) => a.sieveSize - b.sieveSize);

  let chartDataWithLimits = sortedData;
  if (specLimits) {
    chartDataWithLimits = sortedData.map(d => {
        const limits = specLimits[d.sieveSize];
        return {
            ...d,
            specLimitRange: limits ? [limits.min, limits.max] : undefined
        }
    })
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ComposedChart
        data={chartDataWithLimits}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <XAxis
          dataKey="sieveSize"
          type="log"
          scale="log"
          domain={['dataMin', 'dataMax']}
          ticks={[0.15, 0.3, 0.6, 1.18, 2.36, 4.75, 10, 20, 40, 80].filter(s => sortedData.some(d=>d.sieveSize === s))}
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
            formatter={(value, name, props) => {
                if (name === 'specLimitRange') {
                    if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
                        const [min, max] = value;
                        return [`${min}-${max}%`, 'Spec Limits'];
                    }
                    return null;
                }
                if (typeof value === 'number') {
                    return [`${value.toFixed(2)}%`, chartConfig.percentPassing.label]
                }
                return null;
            }}
            labelFormatter={(label, payload) => `Sieve: ${payload?.[0]?.payload.sieveSize}mm`}
          />}
          cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 2, strokeDasharray: "3 3" }}
        />
        <ChartLegend content={<ChartLegendContent />} />

        {specLimits && (
            <Area 
                key={`spec-limit-area`}
                dataKey={`specLimitRange`}
                type="monotone"
                fill={`hsl(var(--muted-foreground) / 0.1)`}
                stroke={`hsl(var(--muted-foreground) / 0.3)`}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                name={chartConfig.specLimits.label}
                tooltipType="none"
            />
        )}

        <Line
          type="monotone"
          dataKey="percentPassing"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={(dotProps) => {
            const { key, ...rest } = dotProps;
            return <CustomDot key={key} {...rest} specLimits={specLimits} />;
          }}
          activeDot={{
            r: 6,
            fill: "hsl(var(--primary))",
            stroke: "hsl(var(--background))",
            strokeWidth: 2,
          }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
