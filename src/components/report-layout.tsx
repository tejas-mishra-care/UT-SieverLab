
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SieveResultsDisplay } from "@/components/sieve-results-display";
import { CombinedSieveChart } from "@/components/combined-sieve-chart";
import type { AnalysisResults } from "@/lib/definitions";
import { SIEVE_SIZES } from "@/lib/sieve-analysis";
import { SieveInputsDisplay } from "./sieve-inputs-display";
import { CombinedGradationTable } from "./combined-gradation-table";

type CoarseForCombination = 'Graded' | 'Coarse - 20mm' | 'Coarse - 10mm';

interface ReportLayoutProps {
  testName: string;
  fineResults: AnalysisResults | null;
  coarseGradedResults: AnalysisResults | null;
  coarseSingle10mmResults: AnalysisResults | null;
  coarseSingle20mmResults: AnalysisResults | null;
  fineWeights: number[];
  coarseGradedWeights: number[];
  coarseSingle10mmWeights: number[];
  coarseSingle20mmWeights: number[];
  combinedChartData: any[]; // Adjust type as needed
  fineAggregatePercentage: number;
  coarseAggregatePercentage: number;
  showCombined: boolean;
  coarseForCombination: CoarseForCombination | null;
}

export function ReportLayout({
  testName,
  fineResults,
  coarseGradedResults,
  coarseSingle10mmResults,
  coarseSingle20mmResults,
  fineWeights,
  coarseGradedWeights,
  coarseSingle10mmWeights,
  coarseSingle20mmWeights,
  combinedChartData,
  fineAggregatePercentage,
  coarseAggregatePercentage,
  showCombined,
  coarseForCombination,
}: ReportLayoutProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Report</CardTitle>
        <CardDescription>A summary of all calculated results. This is a preview of the PDF report.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pdf-render">
        <div className="mb-8 border-b pb-4">
            <h1 className="font-headline text-2xl font-bold">{testName || 'Sieve Analysis Report'}</h1>
            <p className="text-sm text-muted-foreground">
                Generated on: {new Date().toLocaleString()}
            </p>
        </div>

        {fineResults && (
          <div className="page-break space-y-4">
            <h2 className="mb-4 font-headline text-xl font-bold">Fine Aggregate Results</h2>
            <SieveInputsDisplay sieves={SIEVE_SIZES.FINE} weights={fineWeights} />
            <SieveResultsDisplay sieves={SIEVE_SIZES.FINE} type="Fine" weights={fineWeights} {...fineResults} />
          </div>
        )}

        {coarseGradedResults && (
          <>
            {fineResults && <hr className="my-6" />}
            <div className="page-break space-y-4">
              <h2 className="mb-4 font-headline text-xl font-bold">Coarse Aggregate (Graded) Results</h2>
              <SieveInputsDisplay sieves={SIEVE_SIZES.COARSE_GRADED} weights={coarseGradedWeights} />
              <SieveResultsDisplay sieves={SIEVE_SIZES.COARSE_GRADED} type="Coarse - Graded" weights={coarseGradedWeights} {...coarseGradedResults} />
            </div>
          </>
        )}
        
        {coarseSingle20mmResults && (
          <>
            {(fineResults || coarseGradedResults) && <hr className="my-6" />}
            <div className="page-break space-y-4">
              <h2 className="mb-4 font-headline text-xl font-bold">Coarse Aggregate (20mm Single Size) Results</h2>
              <SieveInputsDisplay sieves={SIEVE_SIZES.COARSE_SINGLE_20MM} weights={coarseSingle20mmWeights} />
              <SieveResultsDisplay sieves={SIEVE_SIZES.COARSE_SINGLE_20MM} type="Coarse - 20mm" weights={coarseSingle20mmWeights} {...coarseSingle20mmResults} />
            </div>
          </>
        )}

        {coarseSingle10mmResults && (
          <>
            {(fineResults || coarseGradedResults || coarseSingle20mmResults) && <hr className="my-6" />}
            <div className="page-break space-y-4">
              <h2 className="mb-4 font-headline text-xl font-bold">Coarse Aggregate (10mm Single Size) Results</h2>
              <SieveInputsDisplay sieves={SIEVE_SIZES.COARSE_SINGLE_10MM} weights={coarseSingle10mmWeights} />
              <SieveResultsDisplay sieves={SIEVE_SIZES.COARSE_SINGLE_10MM} type="Coarse - 10mm" weights={coarseSingle10mmWeights} {...coarseSingle10mmResults} />
            </div>
          </>
        )}

        {showCombined && (
          <>
            {(fineResults || coarseGradedResults || coarseSingle10mmResults || coarseSingle20mmResults) && <hr className="my-6" />}
            <div id="combined-gradation-section" className="page-break space-y-6">
              <h2 className="mb-4 font-headline text-xl font-bold">Combined Gradation Results</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Combined Gradation Details</CardTitle>
                  <CardDescription>
                    Analysis for a mix of {fineAggregatePercentage}% Fine Aggregate and {coarseAggregatePercentage}% Coarse Aggregate (Blend with: <span className="font-semibold">{coarseForCombination}</span>) against specification limits for 20mm nominal size graded aggregate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div id="combined-gradation-table-container">
                    <CombinedGradationTable data={combinedChartData} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle>Combined Gradation Curve</CardTitle>
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
