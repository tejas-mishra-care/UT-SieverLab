"use client";

import { SieveChart } from "@/components/sieve-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExtendedAggregateType, AnalysisResults } from "@/lib/definitions";
import { getSpecLimitsForType } from "@/lib/sieve-analysis";
import { AnalysisDetailsTable } from "./analysis-details-table";

interface SieveResultsDisplayProps extends AnalysisResults {
  sieves: number[];
  type: ExtendedAggregateType;
}

export function SieveResultsDisplay({
  sieves,
  type,
  percentRetained,
  cumulativeRetained,
  percentPassing,
  finenessModulus,
  classification,
}: SieveResultsDisplayProps) {
  const chartData = sieves.map((sieve, index) => ({
    sieveSize: sieve,
    percentPassing: percentPassing[index],
    percentRetained: percentRetained[index],
  })).filter(d => d.percentPassing !== undefined);

  // Ensure a unique ID for each chart
  const chartId = `${type.replace(/\s+/g, '-')}-chart`;

  const specLimits = getSpecLimitsForType(type, classification);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aggregate Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{type}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classification || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fineness Modulus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {finenessModulus?.toFixed(2) || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 mt-4">
        <Card id={chartId}>
            <CardHeader>
            <CardTitle>Grading Curve</CardTitle>
            <CardDescription>
                Percentage of material passing and retained on each sieve, compared against IS 383 specification limits.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <SieveChart data={chartData} specLimits={specLimits} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>Tabulated Results</CardTitle>
            <CardDescription>
                Detailed calculated results from the sieve analysis.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="font-bold">Sieve Size (mm)</TableHead>
                    <TableHead className="font-bold text-right">% Retained</TableHead>
                    <TableHead className="font-bold text-right">Cumulative % Retained</TableHead>
                    <TableHead className="font-bold text-right">% Passing</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sieves.map((sieve, index) => (
                    <TableRow key={sieve}>
                        <TableCell className="font-medium">{sieve}</TableCell>
                        <TableCell className="text-right">
                        {percentRetained?.[index]?.toFixed(2) ?? '0.00'}
                        </TableCell>
                        <TableCell className="text-right">
                        {cumulativeRetained?.[index]?.toFixed(2) ?? '0.00'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                        {percentPassing?.[index]?.toFixed(2) ?? '0.00'}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            </CardContent>
        </Card>

        {specLimits && (
            <AnalysisDetailsTable 
                data={chartData}
                specLimits={specLimits}
                title="Specification Compliance Details"
                description={`Comparison against IS 383 limits for ${classification ? classification : type}.`}
            />
        )}
        </div>
    </div>
  );
}
