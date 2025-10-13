
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
import type { AnalysisResults, AggregateType } from "@/lib/definitions";

interface SieveResultsDisplayProps {
  sieves: number[];
  results: AnalysisResults;
  type: AggregateType;
}

export function SieveResultsDisplay({
  sieves,
  results,
  type,
}: SieveResultsDisplayProps) {
  const chartData = sieves.map((sieve, index) => ({
    sieveSize: sieve,
    percentPassing: results.percentPassing[index],
  }));

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
              {results.classification || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fineness Modulus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.finenessModulus?.toFixed(2) || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 mt-4">
        <Card>
            <CardHeader>
            <CardTitle>Grading Curve</CardTitle>
            <CardDescription>
                Percentage of material passing through each sieve.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <SieveChart data={chartData} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>Raw Data</CardTitle>
            <CardDescription>
                Detailed results from the sieve analysis.
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
                        {results.percentRetained[index].toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                        {results.cumulativeRetained[index].toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                        {results.percentPassing[index].toFixed(2)}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            </CardContent>
        </Card>
        </div>
    </div>
  );
}
