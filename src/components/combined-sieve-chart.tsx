"use client";

import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  ComposedChart,
  DotProps,
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
    color: "hsl(var(--muted-foreground) / 0.5)",
  },
  lowerSpecLimit: {
    label: "Lower Limit",
    color: "hsl(var(--muted-foreground) / 0.5)",
  },
};

const CustomDot = (props: DotProps & { payload: any, lowerLimit: number, upperLimit: number }) => {
    const { cx, cy, stroke, payload, value, lowerLimit, upperLimit } = props;

    if (value > upperLimit || value < lowerLimit) {
        return <circle cx={cx} cy={cy} r={5} strokeWidth={2} fill="hsl(var(--destructive))" stroke="hsl(var(--background))" />;
    }

    return <circle cx={cx} cy={cy} r={4} strokeWidth={2} fill={stroke} stroke="hsl(var(--background))" />;
};


export function CombinedSieveChart({ data }: CombinedSieveChartProps) {
  const sortedData = [...data].sort((a, b) => a.sieveSize - b.sieveSize);
  const hasRecommended = sortedData.some(d => d.recommendedPassing !== null);

  const chartDataWithKeys = sortedData.map(d => ({
    ...d,
    upperSpecLimit: d.upperLimit,
    lowerSpecLimit: d.lowerLimit,
    specLimits: [d.lowerLimit, d.upperLimit],
  }))

  return (
    <div id="combined-gradation-chart">
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
        <ComposedChart
            data={chartDataWithKeys}
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
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            name="% Passing"
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12 }}
            label={{ value: '% Passing', angle: -90, position: 'insideLeft', dx: -10, fontSize: 12 }}
            />
            <Tooltip
            content={<ChartTooltipContent
                formatter={(value, name, item) => {
                    if (name === 'specLimits') {
                        const [lower, upper] = value as number[];
                        return [
                            `${lower.toFixed(1)}% - ${upper.toFixed(1)}%`,
                            "Spec Limits"
                        ]
                    }
                    const key = name as keyof typeof chartConfig;
                    if (!chartConfig[key]) return null;
                    if (value === null) return null;
                    
                    const configItem = chartConfig[key];
                    const label = configItem?.label;

                    return [(value as number).toFixed(2) + '%', label];
                }}
                labelFormatter={(label, payload) => `Sieve: ${payload?.[0]?.payload.sieveSize}mm`}
            />}
            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 2, strokeDasharray: "3 3" }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            
            <Area
                type="monotone"
                dataKey="specLimits"
                stroke="hsl(var(--muted-foreground) / 0.2)"
                fill="hsl(var(--muted-foreground) / 0.1)"
                strokeWidth={0}
                name="specLimits"
                tooltipType="none"
            />

            <Line
                key="line-upper"
                dataKey="upperSpecLimit"
                type="monotone"
                stroke="hsl(var(--muted-foreground) / 0.5)"
                strokeDasharray="5 5"
                dot={false}
                strokeWidth={1.5}
                name="upperSpecLimit"
                legendType='line'
            />
            <Line
                key="line-lower"
                dataKey="lowerSpecLimit"
                type="monotone"
                stroke="hsl(var(--muted-foreground) / 0.5)"
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
                dot={(dotProps) => {
                  const { key, ...rest } = dotProps;
                  return <CustomDot key={key} {...rest} lowerLimit={rest.payload.lowerLimit} upperLimit={rest.payload.upperLimit} />;
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
                dot={(dotProps) => {
                    const { key, ...rest } = dotProps;
                    return <CustomDot key={key} {...rest} lowerLimit={rest.payload.lowerLimit} upperLimit={rest.payload.upperLimit} />;
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
    </div>
  );
}
