
"use client";

import {
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
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
  specLimits: Record<string, Record<number, { min: number; max: number }>> | null;
}

const chartConfig = {
  percentPassing: {
    label: "% Passing",
    color: "hsl(var(--primary))",
  },
  zone1: { label: 'Zone I Limits', color: 'hsl(var(--chart-2))'},
  zone2: { label: 'Zone II Limits', color: 'hsl(var(--chart-3))'},
  zone3: { label: 'Zone III Limits', color: 'hsl(var(--chart-4))'},
  zone4: { label: 'Zone IV Limits', color: 'hsl(var(--chart-5))'},
};


export function SieveChart({ data, specLimits }: SieveChartProps) {
  const sortedData = [...data].sort((a, b) => a.sieveSize - b.sieveSize);

  let chartDataWithLimits = sortedData;
  if (specLimits) {
    chartDataWithLimits = sortedData.map(d => {
        const limits: any = {};
        for(const zone in specLimits) {
            const zoneKey = zone.replace('Zone ', '');
            if(specLimits[zone][d.sieveSize]) {
                limits[`zone${zoneKey}`] = [specLimits[zone][d.sieveSize].min, specLimits[zone][d.sieveSize].max];
            }
        }
        return {
            ...d,
            ...limits
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
                if (name.startsWith('zone')) {
                    if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
                        const [min, max] = value;
                        return [`${min}-${max}%`, `Zone ${props.dataKey.toString().replace('zone', '')} Limits`];
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

        {specLimits && Object.keys(specLimits).map((zone, index) => (
            <Area 
                key={`zone-area-${index}`}
                dataKey={`zone${zone.replace('Zone ', '')}`}
                type="monotone"
                fill={`hsla(var(--chart-${index+2}), 0.1)`}
                stroke={`hsla(var(--chart-${index+2}), 0.4)`}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                name={`Zone ${zone.replace('Zone ', '')}`}
                tooltipType="none"
            />
        ))}

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
      </ComposedChart>
    </ChartContainer>
  );
}
