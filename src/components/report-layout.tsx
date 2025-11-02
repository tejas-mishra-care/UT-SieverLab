"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SieveResultsDisplay } from "@/components/sieve-results-display";
import { CombinedSieveChart } from "@/components/combined-sieve-chart";
import type { AnalysisResults, ExtendedAggregateType, FineAggregateType } from "@/lib/definitions";
import { SIEVE_SIZES } from "@/lib/sieve-analysis";
import { SieveInputsDisplay } from "./sieve-inputs-display";
import { CombinedGradationTable } from "./combined-gradation-table";

type BlendSelection = {
    fine: { type: 'Fine', fineAggType: FineAggregateType, results: AnalysisResults }[];
    coarse: { type: ExtendedAggregateType, results: AnalysisResults }[];
}

interface ReportLayoutProps {
  testName: string;
  fineNaturalSandResults: AnalysisResults | null;
  fineCrushedSandResults: AnalysisResults | null;
  coarseGradedResults: AnalysisResults | null;
  coarseSingle10mmResults: AnalysisResults | null;
  coarseSingle20mmResults: AnalysisResults | null;
  fineNaturalSandWeights: number[];
  fineCrushedSandWeights: number[];
  coarseGradedWeights: number[];
  coarseSingle10mmWeights: number[];
  coarseSingle20mmWeights: number[];
  combinedChartData: any[];
  blendSelection: BlendSelection;
  blendPercentages: Record<string, number>;
  showCombined: boolean;
}

export function ReportLayout({
  testName,
  fineNaturalSandResults,
  fineCrushedSandResults,
  coarseGradedResults,
  coarseSingle10mmResults,
  coarseSingle20mmResults,
  fineNaturalSandWeights,
  fineCrushedSandWeights,
  coarseGradedWeights,
  coarseSingle10mmWeights,
  coarseSingle20mmWeights,
  combinedChartData,
  blendSelection,
  blendPercentages,
  showCombined,
}: ReportLayoutProps) {

    const getBlendDescription = () => {
        if (blendSelection.fine.length === 0 || blendSelection.coarse.length === 0) {
            return "No blend selected.";
        }

        const fineParts = blendSelection.fine.map(f => `${blendPercentages[f.fineAggType]}% ${f.fineAggType}`);
        const coarseParts = blendSelection.coarse.map(c => `${blendPercentages[c.type]}% ${c.type}`);

        const parts = [...fineParts, ...coarseParts];

        return `Analysis for a mix of: ${parts.join(', ')}.`;
    }

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

        {fineNaturalSandResults && (
          <div className="page-break space-y-4">
            <h2 className="mb-4 font-headline text-xl font-bold">Fine Aggregate (Natural Sand) Results</h2>
            <SieveInputsDisplay sieves={SIEVE_SIZES.FINE} weights={fineNaturalSandWeights} />
            <SieveResultsDisplay sieves={SIEVE_SIZES.FINE} type="Fine" weights={fineNaturalSandWeights} {...fineNaturalSandResults} fineAggType="Natural Sand" />
          </div>
        )}

        {fineCrushedSandResults && (
          <>
            {fineNaturalSandResults && <hr className="my-6" />}
            <div className="page-break space-y-4">
              <h2 className="mb-4 font-headline text-xl font-bold">Fine Aggregate (Crushed Sand) Results</h2>
              <SieveInputsDisplay sieves={SIEVE_SIZES.FINE} weights={fineCrushedSandWeights} />
              <SieveResultsDisplay sieves={SIEVE_SIZES.FINE} type="Fine" weights={fineCrushedSandWeights} {...fineCrushedSandResults} fineAggType="Crushed Sand" />
            </div>
          </>
        )}

        {coarseGradedResults && (
          <>
            {(fineNaturalSandResults || fineCrushedSandResults) && <hr className="my-6" />}
            <div className="page-break space-y-4">
              <h2 className="mb-4 font-headline text-xl font-bold">Coarse Aggregate (Graded) Results</h2>
              <SieveInputsDisplay sieves={SIEVE_SIZES.COARSE_GRADED} weights={coarseGradedWeights} />
              <SieveResultsDisplay sieves={SIEVE_SIZES.COARSE_GRADED} type="Coarse - Graded" weights={coarseGradedWeights} {...coarseGradedResults} />
            </div>
          </>
        )}
        
        {coarseSingle20mmResults && (
          <>
            {(fineNaturalSandResults || fineCrushedSandResults || coarseGradedResults) && <hr className="my-6" />}
            <div className="page-break space-y-4">
              <h2 className="mb-4 font-headline text-xl font-bold">Coarse Aggregate (20mm Single Size) Results</h2>
              <SieveInputsDisplay sieves={SIEVE_SIZES.COARSE_SINGLE_20MM} weights={coarseSingle20mmWeights} />
              <SieveResultsDisplay sieves={SIEVE_SIZES.COARSE_SINGLE_20MM} type="Coarse - 20mm" weights={coarseSingle20mmWeights} {...coarseSingle20mmResults} />
            </div>
          </>
        )}

        {coarseSingle10mmResults && (
          <>
            {(fineNaturalSandResults || fineCrushedSandResults || coarseGradedResults || coarseSingle20mmResults) && <hr className="my-6" />}
            <div className="page-break space-y-4">
              <h2 className="mb-4 font-headline text-xl font-bold">Coarse Aggregate (10mm Single Size) Results</h2>
              <SieveInputsDisplay sieves={SIEVE_SIZES.COARSE_SINGLE_10MM} weights={coarseSingle10mmWeights} />
              <SieveResultsDisplay sieves={SIEVE_SIZES.COARSE_SINGLE_10MM} type="Coarse - 10mm" weights={coarseSingle10mmWeights} {...coarseSingle10mmResults} />
            </div>
          </>
        )}

        {showCombined && (
          <>
            {(fineNaturalSandResults || fineCrushedSandResults || coarseGradedResults || coarseSingle10mmResults || coarseSingle20mmResults) && <hr className="my-6" />}
            <div id="combined-gradation-section" className="page-break space-y-6">
                <div className="space-y-2">
                    <h2 className="font-headline text-xl font-bold">Combined Gradation Results</h2>
                    <p className="text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: getBlendDescription() }} />
                </div>
              
              <Card>
                <CardHeader>
                    <CardTitle>Combined Gradation Curve</CardTitle>
                    <CardDescription>The combined gradation curve is plotted against the standard IS 383 limits for 20mm nominal size graded aggregate.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CombinedSieveChart data={combinedChartData} />
                </CardContent>
              </Card>

              <CombinedGradationTable data={combinedChartData} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
