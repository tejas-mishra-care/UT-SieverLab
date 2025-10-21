
"use client";

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { SieveAnalysisForm } from './sieve-analysis-form';
import type { AnalysisResults, CoarseAggregateType, SingleSizeType, ExtendedAggregateType } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { CombinedSieveChart } from './combined-sieve-chart';
import { SIEVE_SIZES, SPEC_LIMITS_COARSE_GRADED_20MM, getSievesForType, getSpecLimitsForType } from '@/lib/sieve-analysis';
import { ReportLayout } from './report-layout';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { generatePdf } from '@/lib/generate-pdf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

type CoarseForCombination = 'Graded' | 'Coarse - 20mm' | 'Coarse - 10mm';

export function SieveAnalysisCalculator() {
    const { toast } = useToast();

    const [activeTab, setActiveTab] = React.useState('fine');

    const [fineResults, setFineResults] = React.useState<AnalysisResults | null>(null);
    const [coarseGradedResults, setCoarseGradedResults] = React.useState<AnalysisResults | null>(null);
    const [coarseSingle20mmResults, setCoarseSingle20mmResults] = React.useState<AnalysisResults | null>(null);
    const [coarseSingle10mmResults, setCoarseSingle10mmResults] = React.useState<AnalysisResults | null>(null);

    const [fineWeights, setFineWeights] = React.useState<(number | null)[]>([]);
    const [coarseGradedWeights, setCoarseGradedWeights] = React.useState<(number | null)[]>([]);
    const [coarseSingle20mmWeights, setCoarseSingle20mmWeights] = React.useState<(number | null)[]>([]);
    const [coarseSingle10mmWeights, setCoarseSingle10mmWeights] = React.useState<(number | null)[]>([]);

    const [isCalculating, setIsCalculating] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [testName, setTestName] = React.useState('');

    const [fineAggregatePercentage, setFineAggregatePercentage] = React.useState(35);
    const coarseAggregatePercentage = 100 - fineAggregatePercentage;
    const reportRef = React.useRef<HTMLDivElement>(null);
    
    const [coarseAggType, setCoarseAggType] = React.useState<CoarseAggregateType>('Graded');
    const [activeCoarseTab, setActiveCoarseTab] = React.useState<SingleSizeType | 'graded'>('graded');
    const [coarseForCombination, setCoarseForCombination] = React.useState<CoarseForCombination | null>(null);


    const handleCalculation = (
        _type: ExtendedAggregateType, 
        resultsSetter: React.Dispatch<React.SetStateAction<AnalysisResults | null>>,
        weightsSetter: React.Dispatch<React.SetStateAction<(number | null)[]>>
    ) => {
        return (results: AnalysisResults, weights: number[]) => {
            setIsCalculating(true);
            resultsSetter(results);
            weightsSetter(weights);
            toast({ title: "Calculation complete!" });
            setIsCalculating(false);
        };
    };

    const handleDownloadPdf = async () => {
        if (!isReportReady) {
            toast({
                variant: "destructive",
                title: "Cannot generate PDF",
                description: "Please calculate results for at least one aggregate type.",
            });
            return;
        }

        setIsDownloading(true);
        try {
            await generatePdf({
                testName,
                fineResults,
                coarseGradedResults,
                coarseSingle10mmResults,
                coarseSingle20mmResults,
                fineWeights: fineWeights.map(w => w || 0),
                coarseGradedWeights: coarseGradedWeights.map(w => w || 0),
                coarseSingle10mmWeights: coarseSingle10mmWeights.map(w => w || 0),
                coarseSingle20mmWeights: coarseSingle20mmWeights.map(w => w || 0),
                combinedChartData,
                fineAggregatePercentage,
                coarseAggregatePercentage,
                showCombined: isCombinedTabActive,
                coarseForCombination: coarseForCombination
            });
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast({
                variant: "destructive",
                title: "PDF Error",
                description: "An unexpected error occurred while generating the PDF.",
            });
        } finally {
            setIsDownloading(false);
        }
    };
    
    const availableCoarseForCombination = React.useMemo(() => {
        const options: CoarseForCombination[] = [];
        if (coarseGradedResults) options.push('Graded');
        if (coarseSingle20mmResults) options.push('Coarse - 20mm');
        if (coarseSingle10mmResults) options.push('Coarse - 10mm');
        return options;
    }, [coarseGradedResults, coarseSingle20mmResults, coarseSingle10mmResults]);

    const isCombinedTabActive = React.useMemo(() => {
        return fineResults !== null && availableCoarseForCombination.length > 0;
    }, [fineResults, availableCoarseForCombination]);
    
    React.useEffect(() => {
        if (isCombinedTabActive && !coarseForCombination && availableCoarseForCombination.length > 0) {
            setCoarseForCombination(availableCoarseForCombination[0]);
        }
        if (!isCombinedTabActive) {
            setCoarseForCombination(null);
        }
    }, [isCombinedTabActive, availableCoarseForCombination, coarseForCombination]);

    const combinedChartData = React.useMemo(() => {
        if (!isCombinedTabActive || !fineResults || !coarseForCombination) return [];

        let coarseResults: AnalysisResults | null = null;
        let coarseSieves: number[] = [];

        if (coarseForCombination === 'Graded' && coarseGradedResults) {
            coarseResults = coarseGradedResults;
            coarseSieves = getSievesForType('Coarse - Graded');
        } else if (coarseForCombination === 'Coarse - 20mm' && coarseSingle20mmResults) {
            coarseResults = coarseSingle20mmResults;
            coarseSieves = getSievesForType('Coarse - 20mm');
        } else if (coarseForCombination === 'Coarse - 10mm' && coarseSingle10mmResults) {
            coarseResults = coarseSingle10mmResults;
            coarseSieves = getSievesForType('Coarse - 10mm');
        }
        
        if (!coarseResults) return [];

        const fineSieves = getSievesForType('Fine');
        const allSieves = [...new Set([...fineSieves, ...coarseSieves])].sort((a,b) => b-a);
        
        const finePassingMap = new Map(fineSieves.map((s, i) => [s, fineResults.percentPassing[i]]));
        const coarsePassingMap = new Map(coarseSieves.map((s, i) => [s, coarseResults!.percentPassing[i]]));

        return allSieves.map(sieve => {
            const fineP = finePassingMap.get(sieve) ?? (sieve > Math.max(...fineSieves) ? 100 : 0);
            const coarseP = coarsePassingMap.get(sieve) ?? (sieve > Math.max(...coarseSieves) ? 100 : 0);
            
            const combinedPassing = (fineP * (fineAggregatePercentage / 100)) + (coarseP * (coarseAggregatePercentage / 100));
            const specLimits = getSpecLimitsForType('Coarse - Graded');
            
            return {
                sieveSize: sieve,
                combinedPassing: combinedPassing,
                upperLimit: specLimits?.[sieve]?.max ?? 100,
                lowerLimit: specLimits?.[sieve]?.min ?? 0,
                recommendedPassing: null, 
            };
        }).sort((a,b) => a.sieveSize - b.sieveSize);
    }, [fineResults, coarseGradedResults, coarseSingle10mmResults, coarseSingle20mmResults, coarseForCombination, fineAggregatePercentage, coarseAggregatePercentage, isCombinedTabActive]);


    const isReportReady = fineResults !== null || coarseGradedResults !== null || coarseSingle10mmResults !== null || coarseSingle20mmResults !== null;

    React.useEffect(() => {
        if(coarseAggType === 'Graded') {
            setActiveCoarseTab('graded');
        } else if (activeCoarseTab === 'graded') {
            setActiveCoarseTab('20mm');
        }
    }, [coarseAggType, activeCoarseTab]);

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
             <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="fine">Fine Aggregate</TabsTrigger>
                        <TabsTrigger value="coarse">Coarse Aggregate</TabsTrigger>
                        <TabsTrigger value="combined" disabled={!isCombinedTabActive}>
                            Combined Gradation
                        </TabsTrigger>
                        <TabsTrigger value="report" disabled={!isReportReady}>Report</TabsTrigger>
                    </TabsList>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Test Details & Actions</CardTitle>
                        <CardDescription>Name your test and download your results.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4">
                        <Input 
                            placeholder="Enter Test Name (e.g., 'Site A - Fine Sand')" 
                            value={testName}
                            onChange={(e) => setTestName(e.target.value)}
                            className="max-w-md flex-grow"
                        />
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
                    </CardContent>
                </Card>
            </div>
            
            <TabsContent value="fine">
                <SieveAnalysisForm
                    aggregateType="Fine"
                    onCalculate={handleCalculation("Fine", setFineResults, setFineWeights)}
                    isLoading={isCalculating}
                    initialWeights={fineWeights}
                />
            </TabsContent>

            <TabsContent value="coarse">
                 <div className='space-y-4'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Coarse Aggregate Type</CardTitle>
                            <CardDescription>Select the type of coarse aggregate to analyze.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={coarseAggType} onValueChange={(val) => setCoarseAggType(val as CoarseAggregateType)}>
                                <SelectTrigger className='max-w-sm'>
                                    <SelectValue placeholder="Select coarse aggregate type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Graded">Graded Aggregate</SelectItem>
                                    <SelectItem value="Single Size">Single Size Aggregate</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {coarseAggType === 'Graded' && (
                        <SieveAnalysisForm
                            aggregateType="Coarse - Graded"
                            onCalculate={handleCalculation('Coarse - Graded', setCoarseGradedResults, setCoarseGradedWeights)}
                            isLoading={isCalculating}
                            initialWeights={coarseGradedWeights}
                        />
                    )}

                    {coarseAggType === 'Single Size' && (
                         <Tabs value={activeCoarseTab} onValueChange={setActiveCoarseTab} className="w-full">
                             <TabsList className='mb-4'>
                                 <TabsTrigger value="20mm">20mm Single Size</TabsTrigger>
                                 <TabsTrigger value="10mm">10mm Single Size</TabsTrigger>
                             </TabsList>
                             <TabsContent value="20mm">
                                 <SieveAnalysisForm
                                     aggregateType="Coarse - 20mm"
                                     onCalculate={handleCalculation('Coarse - 20mm', setCoarseSingle20mmResults, setCoarseSingle20mmWeights)}
                                     isLoading={isCalculating}
                                     initialWeights={coarseSingle20mmWeights}
                                 />
                             </TabsContent>
                             <TabsContent value="10mm">
                                 <SieveAnalysisForm
                                     aggregateType="Coarse - 10mm"
                                     onCalculate={handleCalculation('Coarse - 10mm', setCoarseSingle10mmResults, setCoarseSingle10mmWeights)}
                                     isLoading={isCalculating}
                                     initialWeights={coarseSingle10mmWeights}
                                 />
                             </TabsContent>
                         </Tabs>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="combined">
                 {isCombinedTabActive ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Combined Gradation Analysis</CardTitle>
                            <CardDescription>Adjust the mix proportions to see how it affects the gradation curve against standard specification limits for 20mm nominal size aggregate.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="font-semibold">Mix Proportions</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                     <div className="space-y-2">
                                        <Label>Coarse Aggregate for Combination</Label>
                                        <Select value={coarseForCombination ?? ''} onValueChange={(val) => setCoarseForCombination(val as CoarseForCombination)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Coarse Aggregate..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableCoarseForCombination.map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                     </div>
                                    <div className='space-y-2'>
                                        <Label>Fine Aggregate Percentage</Label>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Fine: <span className='font-bold'>{fineAggregatePercentage}%</span></span>
                                            <span>Coarse: <span className='font-bold'>{coarseAggregatePercentage}%</span></span>
                                        </div>
                                        <Slider
                                            value={[fineAggregatePercentage]}
                                            onValueChange={(value) => setFineAggregatePercentage(value[0])}
                                            max={100}
                                            step={1}
                                        />
                                    </div>
                                </div>
                            </div>
                            <CombinedSieveChart data={combinedChartData} />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Calculate fine and at least one coarse aggregate to enable this view.</p>
                    </Card>
                )}
            </TabsContent>

            <TabsContent value="report">
                <div id="pdf-content" ref={reportRef}>
                    {isReportReady ? (
                        <ReportLayout 
                            testName={testName}
                            fineResults={fineResults}
                            coarseGradedResults={coarseGradedResults}
                            coarseSingle10mmResults={coarseSingle10mmResults}
                            coarseSingle20mmResults={coarseSingle20mmResults}
                            fineWeights={fineWeights.map(w => w || 0)}
                            coarseGradedWeights={coarseGradedWeights.map(w => w || 0)}
                            coarseSingle10mmWeights={coarseSingle10mmWeights.map(w=>w||0)}
                            coarseSingle20mmWeights={coarseSingle20mmWeights.map(w=>w||0)}
                            combinedChartData={combinedChartData}
                            fineAggregatePercentage={fineAggregatePercentage}
                            coarseAggregatePercentage={coarseAggregatePercentage}
                            showCombined={isCombinedTabActive}
                            coarseForCombination={coarseForCombination}
                        />
                    ) : (
                        <Card className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">Calculate results for an aggregate type to view the report.</p>
                        </Card>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
}
