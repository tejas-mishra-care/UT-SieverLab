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
import type { AggregateType, AnalysisResults } from "@/lib/definitions";

interface SieveResultsDisplayProps extends AnalysisResults {
  sieves: number[];
  type: AggregateType;
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
  })).filter(d => d.percentPassing !== undefined); // Ensure no undefined values go to chart

  const chartId = type === 'Fine' ? 'fine-aggregate-chart' : 'coarse-aggregate-chart';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight (WT)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-xs text-muted-foreground">
                <p>WT = &#8721;(Sieve Wt.) + Pan Wt.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 mt-4">
        <Card id={chartId}>
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
            <CardTitle>Analysis Results</CardTitle>
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
        </div>
    </div>
  );
}
