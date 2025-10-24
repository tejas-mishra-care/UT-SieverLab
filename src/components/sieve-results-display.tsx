
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
import { getSpecLimitsForType, findBestFitZone } from "@/lib/sieve-analysis";
import { cn } from "@/lib/utils";
import { ZoneVerificationTable } from "./zone-verification-table";


interface SieveResultsDisplayProps extends AnalysisResults {
  sieves: number[];
  type: ExtendedAggregateType;
  weights: number[]; // Added weights here
}

export function SieveResultsDisplay({
  sieves,
  type,
  weights,
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

  const bestFitZone = type === 'Fine' ? findBestFitZone(percentPassing, sieves) : null;
  const specLimits = getSpecLimitsForType(type, type === 'Fine' ? bestFitZone : classification);
  const showsVerification = type === 'Fine' && classification !== bestFitZone;

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
            <CardTitle className="text-sm font-medium">{type === 'Fine' ? 'Zone' : 'Classification'}</CardTitle>
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
                        <TableHead className="font-bold text-right">Wt. Ret (g)</TableHead>
                        <TableHead className="font-bold text-right">% Retained</TableHead>
                        <TableHead className="font-bold text-right">Cumulative % Retained</TableHead>
                        <TableHead className="font-bold text-right">% Passing</TableHead>
                        <TableHead className="font-bold text-center">BIS Limits (%)</TableHead>
                        <TableHead className="font-bold text-center">Remark</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sieves.map((sieve, index) => {
                       const limits = specLimits ? specLimits[sieve] : null;
                       const isOutOfSpec = limits ? 
                          percentPassing[index] < limits.min || percentPassing[index] > limits.max 
                          : false;
                       const is600Micron = type === 'Fine' && sieve === 0.6;

                       return (
                        <TableRow 
                          key={sieve} 
                          className={cn(
                            is600Micron && "bg-yellow-100 dark:bg-yellow-900/50",
                            isOutOfSpec && "bg-destructive/10"
                          )}
                        >
                            <TableCell className="font-medium">{sieve}</TableCell>
                            <TableCell className="text-right">{(weights?.[index] ?? 0).toFixed(1)}</TableCell>
                            <TableCell className="text-right">
                                {percentRetained?.[index]?.toFixed(2) ?? '0.00'}
                            </TableCell>
                            <TableCell className="text-right">
                                {cumulativeRetained?.[index]?.toFixed(2) ?? '0.00'}
                            </TableCell>
                            <TableCell className={cn("text-right font-semibold", isOutOfSpec && "text-destructive")}>
                                {percentPassing?.[index]?.toFixed(2) ?? '0.00'}
                            </TableCell>
                            <TableCell className="text-center">
                                {limits ? `${limits.min.toFixed(0)} - ${limits.max.toFixed(0)}` : "N/A"}
                            </TableCell>
                            <TableCell className={cn("text-center font-medium", isOutOfSpec ? "text-destructive" : "text-green-600")}>
                                {limits ? (isOutOfSpec ? 'FAIL' : 'Pass') : 'N/A'}
                            </TableCell>
                        </TableRow>
                       )
                    })}
                </TableBody>
                </Table>
            </div>
            </CardContent>
        </Card>
        
        {showsVerification && bestFitZone && (
          <ZoneVerificationTable
            sieves={sieves}
            percentPassing={percentPassing}
            bestFitZone={bestFitZone}
          />
        )}
        
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
        </div>
    </div>
  );
}
