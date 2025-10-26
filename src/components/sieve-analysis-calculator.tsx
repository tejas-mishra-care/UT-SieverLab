
"use client";

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';
import { SieveAnalysisForm } from './sieve-analysis-form';
import type { AnalysisResults, CoarseAggregateType, SingleSizeType, ExtendedAggregateType } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { CombinedSieveChart } from './combined-sieve-chart';
import { SIEVE_SIZES, getSievesForType, getSpecLimitsForType, calculateOptimalBlend } from '@/lib/sieve-analysis';
import { ReportLayout } from './report-layout';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { generatePdf } from '@/lib/generate-pdf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

type CoarseForCombination = 'Graded' | 'Coarse - 20mm' | 'Coarse - 10mm' | 'Single Size Blend';
type BlendMode = 'two-material' | 'three-material';

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
    
    // State for blending
    const [blendMode, setBlendMode] = React.useState<BlendMode>('two-material');
    const [coarseForTwoMaterialBlend, setCoarseForTwoMaterialBlend] = React.useState<CoarseForCombination | null>(null);
    const [fineAggregatePercentage, setFineAggregatePercentage] = React.useState(35);
    const [coarse20mmPercentage, setCoarse20mmPercentage] = React.useState(45);
    const [coarse10mmPercentage, setCoarse10mmPercentage] = React.useState(20);

    const reportRef = React.useRef<HTMLDivElement>(null);
    
    const [coarseAggType, setCoarseAggType] = React.useState<CoarseAggregateType>('Graded');
    const [activeCoarseTab, setActiveCoarseTab] = React.useState<SingleSizeType | 'graded'>('graded');

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
                coarseAggregatePercentage: 100 - fineAggregatePercentage,
                coarse20mmPercentage,
                coarse10mmPercentage,
                showCombined: isCombinedTabActive,
                coarseForCombination: blendMode === 'three-material' ? 'Single Size Blend' : coarseForTwoMaterialBlend,
                blendMode,
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
    
    const isThreeMaterialBlendPossible = fineResults && coarseSingle10mmResults && coarseSingle20mmResults;
    
    const availableCoarseForTwoMaterialBlend = React.useMemo(() => {
        const options: CoarseForCombination[] = [];
        if (coarseGradedResults) options.push('Graded');
        if (coarseSingle20mmResults) options.push('Coarse - 20mm');
        if (coarseSingle10mmResults) options.push('Coarse - 10mm');
        return options;
    }, [coarseGradedResults, coarseSingle20mmResults, coarseSingle10mmResults]);

    const isCombinedTabActive = React.useMemo(() => {
        return fineResults !== null && (availableCoarseForTwoMaterialBlend.length > 0 || isThreeMaterialBlendPossible);
    }, [fineResults, availableCoarseForTwoMaterialBlend, isThreeMaterialBlendPossible]);
    
    // Auto-select blend type
    React.useEffect(() => {
        if (isCombinedTabActive) {
            if (isThreeMaterialBlendPossible) {
                setBlendMode('three-material');
            } else {
                setBlendMode('two-material');
                if (!coarseForTwoMaterialBlend && availableCoarseForTwoMaterialBlend.length > 0) {
                    setCoarseForTwoMaterialBlend(availableCoarseForTwoMaterialBlend[0]);
                }
            }
        }
    }, [isCombinedTabActive, isThreeMaterialBlendPossible, coarseForTwoMaterialBlend, availableCoarseForTwoMaterialBlend]);

    const handleRecommendBlend = () => {
        if (!isCombinedTabActive || !fineResults) return;

        let materials: { passingCurve: Map<number, number> }[] = [];

        if (blendMode === 'three-material' && coarseSingle10mmResults && coarseSingle20mmResults) {
            materials = [
                { passingCurve: new Map(getSievesForType('Fine').map((s, i) => [s, fineResults.percentPassing[i]])) },
                { passingCurve: new Map(getSievesForType('Coarse - 20mm').map((s, i) => [s, coarseSingle20mmResults.percentPassing[i]])) },
                { passingCurve: new Map(getSievesForType('Coarse - 10mm').map((s, i) => [s, coarseSingle10mmResults.percentPassing[i]])) },
            ];
        } else if (blendMode === 'two-material' && coarseForTwoMaterialBlend) {
            let coarseResults: AnalysisResults | null = null;
            let coarseSieves: number[] = [];
            if (coarseForTwoMaterialBlend === 'Graded' && coarseGradedResults) { coarseResults = coarseGradedResults; coarseSieves = getSievesForType('Coarse - Graded'); }
            else if (coarseForTwoMaterialBlend === 'Coarse - 20mm' && coarseSingle20mmResults) { coarseResults = coarseSingle20mmResults; coarseSieves = getSievesForType('Coarse - 20mm'); }
            else if (coarseForTwoMaterialBlend === 'Coarse - 10mm' && coarseSingle10mmResults) { coarseResults = coarseSingle10mmResults; coarseSieves = getSievesForType('Coarse - 10mm'); }

            if (coarseResults) {
                materials = [
                    { passingCurve: new Map(getSievesForType('Fine').map((s, i) => [s, fineResults.percentPassing[i]])) },
                    { passingCurve: new Map(coarseSieves.map((s, i) => [s, coarseResults.percentPassing[i]])) },
                ];
            }
        } else {
             toast({ variant: 'destructive', title: "Cannot Recommend Blend", description: "Required aggregate results are missing for the selected blend mode." });
            return;
        }

        const optimalPercentages = calculateOptimalBlend(materials);

        if (optimalPercentages) {
            if (blendMode === 'two-material') {
                setFineAggregatePercentage(optimalPercentages[0]);
            } else if (blendMode === 'three-material') {
                setFineAggregatePercentage(optimalPercentages[0]);
                setCoarse20mmPercentage(optimalPercentages[1]);
                setCoarse10mmPercentage(optimalPercentages[2]);
            }
            toast({
                title: "Recommendation Updated",
                description: `Sliders set to optimal blend.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: "No Optimal Blend Found",
                description: "Could not find a combination that meets the specification limits.",
            });
        }
    };
    
    const handleThreeMaterialSliderChange = (value: number, material: 'fa' | 'c20' | 'c10') => {
        const remaining = 100 - value;
        if (material === 'fa') {
            const oldFa = fineAggregatePercentage;
            const c20 = coarse20mmPercentage;
            const c10 = coarse10mmPercentage;
            const totalCoarse = c20 + c10;
            if (totalCoarse === 0) {
                setCoarse20mmPercentage(remaining / 2);
                setCoarse10mmPercentage(remaining / 2);
            } else {
                const ratio20 = c20 / totalCoarse;
                const ratio10 = c10 / totalCoarse;
                setCoarse20mmPercentage(Math.round(remaining * ratio20));
                setCoarse10mmPercentage(Math.round(remaining * ratio10));
            }
            setFineAggregatePercentage(value);
        } else if (material === 'c20') {
            const c10 = 100 - fineAggregatePercentage - value;
            if (c10 >= 0) {
                setCoarse10mmPercentage(c10);
                setCoarse20mmPercentage(value);
            }
        } else if (material === 'c10') {
            const c20 = 100 - fineAggregatePercentage - value;
            if (c20 >= 0) {
                setCoarse20mmPercentage(c20);
                setCoarse10mmPercentage(value);
            }
        }
    };


    const combinedChartData = React.useMemo(() => {
        if (!isCombinedTabActive || !fineResults) return [];

        let data = [];
        const fineSieves = getSievesForType('Fine');
        const finePassingMap = new Map(fineSieves.map((s, i) => [s, fineResults.percentPassing[i]]));

        if (blendMode === 'three-material' && coarseSingle10mmResults && coarseSingle20mmResults) {
            const c20Sieves = getSievesForType('Coarse - 20mm');
            const c10Sieves = getSievesForType('Coarse - 10mm');
            const c20PassingMap = new Map(c20Sieves.map((s, i) => [s, coarseSingle20mmResults.percentPassing[i]]));
            const c10PassingMap = new Map(c10Sieves.map((s, i) => [s, coarseSingle10mmResults.percentPassing[i]]));
            const allSieves = [...new Set([...fineSieves, ...c20Sieves, ...c10Sieves])].sort((a,b) => b-a);
            
            data = allSieves.map(sieve => {
                const fineP = finePassingMap.get(sieve) ?? (sieve > Math.max(...fineSieves) ? 100 : 0);
                const c20P = c20PassingMap.get(sieve) ?? (sieve > Math.max(...c20Sieves) ? 100 : 0);
                const c10P = c10PassingMap.get(sieve) ?? (sieve > Math.max(...c10Sieves) ? 100 : 0);
                
                const combinedPassing = (fineP * (fineAggregatePercentage / 100)) + (c20P * (coarse20mmPercentage / 100)) + (c10P * (coarse10mmPercentage / 100));
                const specLimits = getSpecLimitsForType('Coarse - Graded');
                
                return {
                    sieveSize: sieve,
                    combinedPassing: combinedPassing,
                    upperLimit: specLimits?.[sieve]?.max ?? 100,
                    lowerLimit: specLimits?.[sieve]?.min ?? 0,
                    recommendedPassing: null,
                };
            })

        } else if (blendMode === 'two-material' && coarseForTwoMaterialBlend) {
            let coarseResults: AnalysisResults | null = null;
            let coarseSieves: number[] = [];

            if (coarseForTwoMaterialBlend === 'Graded' && coarseGradedResults) { coarseResults = coarseGradedResults; coarseSieves = getSievesForType('Coarse - Graded'); }
            else if (coarseForTwoMaterialBlend === 'Coarse - 20mm' && coarseSingle20mmResults) { coarseResults = coarseSingle20mmResults; coarseSieves = getSievesForType('Coarse - 20mm'); }
            else if (coarseForTwoMaterialBlend === 'Coarse - 10mm' && coarseSingle10mmResults) { coarseResults = coarseSingle10mmResults; coarseSieves = getSievesForType('Coarse - 10mm'); }
            
            if (!coarseResults) return [];

            const coarsePassingMap = new Map(coarseSieves.map((s, i) => [s, coarseResults!.percentPassing[i]]));
            const allSieves = [...new Set([...fineSieves, ...coarseSieves])].sort((a,b) => b-a);
            
            data = allSieves.map(sieve => {
                const fineP = finePassingMap.get(sieve) ?? (sieve > Math.max(...fineSieves) ? 100 : 0);
                const coarseP = coarsePassingMap.get(sieve) ?? (sieve > Math.max(...coarseSieves) ? 100 : 0);
                
                const combinedPassing = (fineP * (fineAggregatePercentage / 100)) + (coarseP * ((100 - fineAggregatePercentage) / 100));
                const specLimits = getSpecLimitsForType('Coarse - Graded');
                
                return {
                    sieveSize: sieve,
                    combinedPassing: combinedPassing,
                    upperLimit: specLimits?.[sieve]?.max ?? 100,
                    lowerLimit: specLimits?.[sieve]?.min ?? 0,
                    recommendedPassing: null,
                };
            });
        }
        return data.sort((a,b) => a.sieveSize - b.sieveSize);

    }, [fineResults, coarseGradedResults, coarseSingle10mmResults, coarseSingle20mmResults, coarseForTwoMaterialBlend, fineAggregatePercentage, coarse10mmPercentage, coarse20mmPercentage, isCombinedTabActive, blendMode]);


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
                                 />
                             </TabsContent>
                             <TabsContent value="10mm">
                                 <SieveAnalysisForm
                                     aggregateType="Coarse - 10mm"
                                     onCalculate={handleCalculation('Coarse - 10mm', setCoarseSingle10mmResults, setCoarseSingle10mmWeights)}
                                     isLoading={isCalculating}
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
                                <div className='flex justify-between items-center'>
                                <h3 className="font-semibold">Mix Proportions</h3>
                                {isThreeMaterialBlendPossible && <div className='flex items-center gap-2'>
                                    <Label htmlFor='blend-mode-select'>Blend Mode</Label>
                                    <Select value={blendMode} onValueChange={val => setBlendMode(val as BlendMode)} name='blend-mode-select'>
                                        <SelectTrigger className='w-[180px]'>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='two-material'>Two-Material</SelectItem>
                                            <SelectItem value='three-material'>Three-Material</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>}
                                </div>
                                {blendMode === 'two-material' ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                     <div className="space-y-2">
                                        <Label>Coarse Aggregate for Combination</Label>
                                        <Select value={coarseForTwoMaterialBlend ?? ''} onValueChange={(val) => setCoarseForTwoMaterialBlend(val as CoarseForCombination)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Coarse Aggregate..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableCoarseForTwoMaterialBlend.map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                     </div>
                                    <div className='space-y-2'>
                                        <Label>Fine Aggregate Percentage</Label>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Fine: <span className='font-bold'>{fineAggregatePercentage}%</span></span>
                                            <span>Coarse: <span className='font-bold'>{100-fineAggregatePercentage}%</span></span>
                                        </div>
                                        <Slider
                                            value={[fineAggregatePercentage]}
                                            onValueChange={(value) => setFineAggregatePercentage(value[0])}
                                            max={100}
                                            step={1}
                                        />
                                    </div>
                                </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Fine Aggregate ({fineAggregatePercentage}%)</Label>
                                            <Slider value={[fineAggregatePercentage]} onValueChange={([val]) => handleThreeMaterialSliderChange(val, 'fa')} max={100} step={1} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Coarse 20mm ({coarse20mmPercentage}%)</Label>
                                            <Slider value={[coarse20mmPercentage]} onValueChange={([val]) => handleThreeMaterialSliderChange(val, 'c20')} max={100 - fineAggregatePercentage} step={1} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Coarse 10mm ({coarse10mmPercentage}%)</Label>
                                            <Slider value={[coarse10mmPercentage]} onValueChange={([val]) => handleThreeMaterialSliderChange(val, 'c10')} max={100 - fineAggregatePercentage} step={1} />
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <Button onClick={handleRecommendBlend}>
                                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                                        Recommend Blend
                                    </Button>
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
                            coarseAggregatePercentage={100 - fineAggregatePercentage}
                            coarse10mmPercentage={coarse10mmPercentage}
                            coarse20mmPercentage={coarse20mmPercentage}
                            showCombined={isCombinedTabActive}
                            coarseForCombination={blendMode === 'three-material' ? 'Single Size Blend' : coarseForTwoMaterialBlend}
                            blendMode={blendMode}
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
