
"use client";

import * as React from 'react';
import jsPDF from 'jspdf';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { SieveAnalysisForm } from './sieve-analysis-form';
import type { AggregateType, AnalysisResults } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { CombinedSieveChart } from './combined-sieve-chart';
import { SIEVE_SIZES, SPEC_LIMITS } from '@/lib/sieve-analysis';
import { ReportLayout } from './report-layout';

export function SieveAnalysisCalculator() {
    const [fineResults, setFineResults] = React.useState<AnalysisResults | null>(null);
    const [coarseResults, setCoarseResults] = React.useState<AnalysisResults | null>(null);

    const [fineWeights, setFineWeights] = React.useState<(number | null)[]>(SIEVE_SIZES.FINE.map(() => null));
    const [coarseWeights, setCoarseWeights] = React.useState<(number | null)[]>(SIEVE_SIZES.COARSE.map(() => null));
    
    const [isFineCalculating, setIsFineCalculating] = React.useState(false);
    const [isCoarseCalculating, setIsCoarseCalculating] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);

    const [fineAggregatePercentage, setFineAggregatePercentage] = React.useState(35);
    const coarseAggregatePercentage = 100 - fineAggregatePercentage;
    const reportRef = React.useRef<HTMLDivElement>(null);

    const handleCalculation = (
        type: AggregateType, 
        setter: React.Dispatch<React.SetStateAction<boolean>>, 
        resultsSetter: React.Dispatch<React.SetStateAction<AnalysisResults | null>>,
        weightsSetter: React.Dispatch<React.SetStateAction<(number | null)[]>>
        ) => {
        return (results: AnalysisResults, weights: number[]) => {
            setter(true);
            resultsSetter(null); // Clear previous results
            resultsSetter(results);
            weightsSetter(weights);
            setter(false);
        };
    };

    const handleDownloadPdf = async () => {
        const reportElement = reportRef.current;
        if (!reportElement) return;

        setIsDownloading(true);

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });
            
            await pdf.html(reportElement, {
                callback: function (doc) {
                    doc.save(`sieve-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`);
                },
                x: 10,
                y: 10,
                width: 190, // A4 width in mm minus margins
                windowWidth: reportElement.offsetWidth,
                autoPaging: 'slice',
                margin: [10, 10, 10, 10],
            });

        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const combinedChartData = React.useMemo(() => {
        if (!fineResults || !coarseResults) return [];
        const allSieves = [...new Set([...SIEVE_SIZES.FINE, ...SIEVE_SIZES.COARSE])].sort((a,b) => b-a);
        
        const finePassingMap = new Map(SIEVE_SIZES.FINE.map((s, i) => [s, fineResults.percentPassing[i]]));
        const coarsePassingMap = new Map(SIEVE_SIZES.COARSE.map((s, i) => [s, coarseResults.percentPassing[i]]));

        return allSieves.map(sieve => {
            const fineP = finePassingMap.get(sieve) ?? (sieve > 4.75 ? 100 : 0);
            const coarseP = coarsePassingMap.get(sieve) ?? (sieve > 80 ? 100 : 0);
            
            const combinedPassing = (fineP * (fineAggregatePercentage / 100)) + (coarseP * (coarseAggregatePercentage / 100));

            return {
                sieveSize: sieve,
                combinedPassing: combinedPassing,
                upperLimit: SPEC_LIMITS[sieve]?.max ?? 100,
                lowerLimit: SPEC_LIMITS[sieve]?.min ?? 0,
                recommendedPassing: null, 
            };
        }).sort((a,b) => a.sieveSize - b.sieveSize);
    }, [fineResults, coarseResults, fineAggregatePercentage]);

    const isCombinedTabActive = fineResults !== null && coarseResults !== null;
    const isReportReady = fineResults !== null || coarseResults !== null;


    return (
        <Tabs defaultValue="fine" className="w-full">
             <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <TabsList>
                    <TabsTrigger value="fine">Fine Aggregate</TabsTrigger>
                    <TabsTrigger value="coarse">Coarse Aggregate</TabsTrigger>
                    <TabsTrigger value="combined" disabled={!isCombinedTabActive}>
                        Combined Gradation
                    </TabsTrigger>
                    <TabsTrigger value="report">Report</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={!isReportReady || isDownloading}>
                        {isDownloading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Download PDF
                    </Button>
                </div>
            </div>
            
            <TabsContent value="fine">
                <SieveAnalysisForm
                    aggregateType="Fine"
                    onCalculate={handleCalculation("Fine", setIsFineCalculating, setFineResults, setFineWeights)}
                    isLoading={isFineCalculating}
                    initialWeights={fineWeights}
                />
            </TabsContent>

            <TabsContent value="coarse">
                <SieveAnalysisForm
                    aggregateType="Coarse"
                    onCalculate={handleCalculation("Coarse", setIsCoarseCalculating, setCoarseResults, setCoarseWeights)}
                    isLoading={isCoarseCalculating}
                    initialWeights={coarseWeights}
                />
            </TabsContent>

            <TabsContent value="combined">
                 {isCombinedTabActive ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Combined Gradation Analysis</CardTitle>
                            <CardDescription>Adjust the mix proportions and see the live results.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold">Mix Proportions</h3>
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Fine Aggregate: <span className='font-bold'>{fineAggregatePercentage}%</span></span>
                                    <span>Coarse Aggregate: <span className='font-bold'>{coarseAggregatePercentage}%</span></span>
                                </div>
                                <Slider
                                    value={[fineAggregatePercentage]}
                                    onValueChange={(value) => setFineAggregatePercentage(value[0])}
                                    max={100}
                                    step={1}
                                />
                            </div>
                            <CombinedSieveChart data={combinedChartData} />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Calculate both fine and coarse aggregates to enable this view.</p>
                    </Card>
                )}
            </TabsContent>

            <TabsContent value="report">
                <ReportLayout 
                    fineResults={fineResults}
                    coarseResults={coarseResults}
                    fineWeights={fineWeights.map(w => w || 0)}
                    coarseWeights={coarseWeights.map(w => w || 0)}
                    combinedChartData={combinedChartData}
                    fineAggregatePercentage={fineAggregatePercentage}
                    coarseAggregatePercentage={coarseAggregatePercentage}
                    showCombined={isCombinedTabActive}
                />
            </TabsContent>

            {/* Hidden div for PDF generation */}
            <div className="absolute -left-[9999px] top-auto w-[800px] bg-white text-black pdf-render" ref={reportRef}>
                 <ReportLayout 
                    fineResults={fineResults}
                    coarseResults={coarseResults}
                    fineWeights={fineWeights.map(w => w || 0)}
                    coarseWeights={coarseWeights.map(w => w || 0)}
                    combinedChartData={combinedChartData}
                    fineAggregatePercentage={fineAggregatePercentage}
                    coarseAggregatePercentage={coarseAggregatePercentage}
                    showCombined={isCombinedTabActive}
                />
            </div>
        </Tabs>
    );
}
