
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SieveResultsDisplay } from "@/components/sieve-results-display";
import { CombinedSieveChart } from "@/components/combined-sieve-chart";
import type { AnalysisResults } from "@/lib/definitions";
import { SIEVE_SIZES } from "@/lib/sieve-analysis";
import { SieveInputsDisplay } from "./sieve-inputs-display";

interface ReportLayoutProps {
  fineResults: AnalysisResults | null;
  coarseResults: AnalysisResults | null;
  fineWeights: number[];
  coarseWeights: number[];
  combinedChartData: any[]; // Adjust type as needed
  fineAggregatePercentage: number;
  coarseAggregatePercentage: number;
  showCombined: boolean;
}

export function ReportLayout({
  fineResults,
  coarseResults,
  fineWeights,
  coarseWeights,
  combinedChartData,
  fineAggregatePercentage,
  coarseAggregatePercentage,
  showCombined,
}: ReportLayoutProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Report</CardTitle>
        <CardDescription>A summary of all calculated results.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="mb-8 border-b pb-4">
            <h1 className="font-headline text-2xl font-bold">Sieve Analysis Report</h1>
            <p className="text-sm text-muted-foreground">
                Generated on: {new Date().toLocaleString()}
            </p>
        </div>

        {fineResults ? (
          <div className="page-break space-y-4">
            <h2 className="mb-4 font-headline text-xl font-bold">Fine Aggregate Results</h2>
            <SieveInputsDisplay sieves={SIEVE_SIZES.FINE} weights={fineWeights} />
            <SieveResultsDisplay sieves={SIEVE_SIZES.FINE} type="Fine" {...fineResults} />
          </div>
        ) : (
          <p className="text-muted-foreground">No fine aggregate results calculated yet.</p>
        )}

        <hr />

        {coarseResults ? (
          <div className="page-break space-y-4">
            <h2 className="mb-4 font-headline text-xl font-bold">Coarse Aggregate Results</h2>
            <SieveInputsDisplay sieves={SIEVE_SIZES.COARSE} weights={coarseWeights} />
            <SieveResultsDisplay sieves={SIEVE_SIZES.COARSE} type="Coarse" {...coarseResults} />
          </div>
        ) : (
          <p className="text-muted-foreground">No coarse aggregate results calculated yet.</p>
        )}

        {showCombined && (
          <>
            <hr />
            <div className="page-break">
              <h2 className="mb-4 font-headline text-xl font-bold">Combined Gradation Results</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Combined Gradation Curve</CardTitle>
                  <CardDescription>
                    Analysis for a mix of {fineAggregatePercentage}% Fine Aggregate and {coarseAggregatePercentage}% Coarse Aggregate against specification limits for 20mm nominal size graded aggregate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CombinedSieveChart data={combinedChartData} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
