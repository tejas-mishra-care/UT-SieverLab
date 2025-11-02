"use client";

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Loader2, SlidersHorizontal } from 'lucide-react';
import { SieveAnalysisForm } from './sieve-analysis-form';
import type { AnalysisResults, CoarseAggregateType, SingleSizeType, ExtendedAggregateType, FineAggregateType } from '@/lib/definitions';
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
import { Checkbox } from './ui/checkbox';

type BlendSelection = {
    fine: { type: 'Fine', fineAggType: FineAggregateType, results: AnalysisResults }[];
    coarse: { type: ExtendedAggregateType, results: AnalysisResults }[];
}

const getInitialWeights = (type: ExtendedAggregateType) => Array(getSievesForType(type).length + 1).fill(null);

export function SieveAnalysisCalculator() {
    const { toast } = useToast();

    const [activeTab, setActiveTab] = React.useState('fine');

    // Analysis Results
    const [fineNaturalSandResults, setFineNaturalSandResults] = React.useState<AnalysisResults | null>(null);
    const [fineCrushedSandResults, setFineCrushedSandResults] = React.useState<AnalysisResults | null>(null);
    const [coarseGradedResults, setCoarseGradedResults] = React.useState<AnalysisResults | null>(null);
    const [coarseSingle20mmResults, setCoarseSingle20mmResults] = React.useState<AnalysisResults | null>(null);
    const [coarseSingle10mmResults, setCoarseSingle10mmResults] = React.useState<AnalysisResults | null>(null);

    // Input Weights
    const [fineNaturalSandWeights, setFineNaturalSandWeights] = React.useState<(number | null)[]>(getInitialWeights('Fine'));
    const [fineCrushedSandWeights, setFineCrushedSandWeights] = React.useState<(number | null)[]>(getInitialWeights('Fine'));
    const [coarseGradedWeights, setCoarseGradedWeights] = React.useState<(number | null)[]>(getInitialWeights('Coarse - Graded'));
    const [coarseSingle20mmWeights, setCoarseSingle20mmWeights] = React.useState<(number | null)[]>(getInitialWeights('Coarse - 20mm'));
    const [coarseSingle10mmWeights, setCoarseSingle10mmWeights] = React.useState<(number | null)[]>(getInitialWeights('Coarse - 10mm'));

    const [isCalculating, setIsCalculating] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [testName, setTestName] = React.useState('');
    
    // State for blending
    const [blendSelection, setBlendSelection] = React.useState<BlendSelection>({ fine: [], coarse: [] });
    const [blendPercentages, setBlendPercentages] = React.useState<Record<string, number>>({});

    const reportRef = React.useRef<HTMLDivElement>(null);
    
    const [activeFineTab, setActiveFineTab] = React.useState<FineAggregateType>('Natural Sand');
    const [coarseAggType, setCoarseAggType] = React.useState<CoarseAggregateType>('Graded');
    const [activeCoarseTab, setActiveCoarseTab] = React.useState<SingleSizeType | 'graded'>('graded');

    const handleCalculation = (
        setter: React.Dispatch<React.SetStateAction<AnalysisResults | null>>
    ) => {
        return (results: AnalysisResults) => {
            setIsCalculating(true);
            setter(results);
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
                fineNaturalSandResults,
                fineCrushedSandResults,
                coarseGradedResults,
                coarseSingle10mmResults,
                coarseSingle20mmResults,
                fineNaturalSandWeights: (fineNaturalSandWeights || []).map(w => w || 0),
                fineCrushedSandWeights: (fineCrushedSandWeights || []).map(w => w || 0),
                coarseGradedWeights: (coarseGradedWeights || []).map(w => w || 0),
                coarseSingle10mmWeights: (coarseSingle10mmWeights || []).map(w => w || 0),
                coarseSingle20mmWeights: (coarseSingle20mmWeights || []).map(w => w || 0),
                combinedChartData,
                blendSelection,
                blendPercentages,
                showCombined: isCombinedTabActive,
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
    
    const availableFineAggregates = React.useMemo(() => {
        const options: { name: string, value: FineAggregateType, results: AnalysisResults }[] = [];
        if(fineNaturalSandResults) options.push({ name: 'Natural Sand', value: 'Natural Sand', results: fineNaturalSandResults });
        if(fineCrushedSandResults) options.push({ name: 'Crushed Sand', value: 'Crushed Sand', results: fineCrushedSandResults });
        return options;
    }, [fineNaturalSandResults, fineCrushedSandResults]);

    const availableCoarseAggregates = React.useMemo(() => {
        const options: { name: ExtendedAggregateType, results: AnalysisResults }[] = [];
        if (coarseGradedResults) options.push({ name: 'Coarse - Graded', results: coarseGradedResults });
        if (coarseSingle20mmResults) options.push({ name: 'Coarse - 20mm', results: coarseSingle20mmResults });
        if (coarseSingle10mmResults) options.push({ name: 'Coarse - 10mm', results: coarseSingle10mmResults });
        return options;
    }, [coarseGradedResults, coarseSingle20mmResults, coarseSingle10mmResults]);

    const isCombinedTabActive = React.useMemo(() => {
        return availableFineAggregates.length > 0 && availableCoarseAggregates.length > 0;
    }, [availableFineAggregates, availableCoarseAggregates]);
    
    React.useEffect(() => {
        if (isCombinedTabActive) {
            if (blendSelection.fine.length === 0 && availableFineAggregates.length > 0) {
                 handleFineSelectionChange(availableFineAggregates[0].value, true);
            }
            if (blendSelection.coarse.length === 0 && availableCoarseAggregates.length > 0) {
                handleCoarseSelectionChange(availableCoarseAggregates[0].name, true);
            }
        }
    }, [isCombinedTabActive, availableFineAggregates, availableCoarseAggregates]);


    React.useEffect(() => {
        const selectedItems = [
            ...blendSelection.fine.map(f => ({ type: f.fineAggType})),
            ...blendSelection.coarse
        ];
        
        if (selectedItems.length === 0) {
            setBlendPercentages({});
            return;
        }

        const currentTotal = Object.values(blendPercentages).reduce((sum, p) => sum + p, 0);

        if (Math.abs(100 - currentTotal) > 0.1 || Object.keys(blendPercentages).length !== selectedItems.length) {
            const equalShare = 100 / selectedItems.length;
            const newPercentages: Record<string, number> = {};
            selectedItems.forEach((item, index) => {
                const key = item.type;
                if (index === selectedItems.length - 1) {
                     newPercentages[key] = 100 - Object.values(newPercentages).reduce((sum, p) => sum + p, 0);
                } else {
                     newPercentages[key] = Math.round(equalShare);
                }
            });
            setBlendPercentages(newPercentages);
        }
    }, [blendSelection]);

    const handleFineSelectionChange = (fineAggType: FineAggregateType, isChecked: boolean) => {
        const fineResult = availableFineAggregates.find(agg => agg.value === fineAggType);
        if(!fineResult) return;

        setBlendSelection(prev => {
            const currentFine = prev.fine;
            const existing = currentFine.find(f => f.fineAggType === fineAggType);
            let newFine: { type: 'Fine', fineAggType: FineAggregateType, results: AnalysisResults }[];

            if (isChecked && !existing) {
                newFine = [...currentFine, { type: 'Fine', fineAggType, results: fineResult.results }];
            } else if (!isChecked && existing) {
                newFine = currentFine.filter(f => f.fineAggType !== fineAggType);
            } else {
                newFine = currentFine;
            }

            return { ...prev, fine: newFine };
        });
    };

    const handleCoarseSelectionChange = (coarseType: ExtendedAggregateType, isChecked: boolean) => {
        const coarseResult = availableCoarseAggregates.find(agg => agg.name === coarseType);
        if(!coarseResult) return;

        setBlendSelection(prev => {
            const currentCoarse = prev.coarse;
            const existing = currentCoarse.find(c => c.type === coarseType);
            let newCoarse: { type: ExtendedAggregateType, results: AnalysisResults }[];

            if (isChecked && !existing) {
                newCoarse = [...currentCoarse, { type: coarseType, results: coarseResult.results }];
            } else if (!isChecked && existing) {
                newCoarse = currentCoarse.filter(c => c.type !== coarseType);
            } else {
                newCoarse = currentCoarse;
            }

            return { ...prev, coarse: newCoarse };
        });
    }

    const handleSliderChange = (value: number, key: string) => {
        const otherKeys = Object.keys(blendPercentages).filter(k => k !== key);
        const remainingPercentage = 100 - value;
        
        const newPercentages: Record<string, number> = { [key]: value };
        
        const currentOtherTotal = otherKeys.reduce((sum, k) => sum + (blendPercentages[k] || 0), 0);

        if (currentOtherTotal > 0) {
            otherKeys.forEach((k, index) => {
                const ratio = (blendPercentages[k] || 0) / currentOtherTotal;
                if(index === otherKeys.length - 1) {
                    newPercentages[k] = 100 - Object.values(newPercentages).reduce((s, p) => s + p, 0);
                } else {
                    newPercentages[k] = Math.round(remainingPercentage * ratio);
                }
            });
        } else if (otherKeys.length > 0) {
            // If others were zero, distribute equally
            const equalShare = remainingPercentage / otherKeys.length;
            otherKeys.forEach((k, index) => {
                 if(index === otherKeys.length - 1) {
                    newPercentages[k] = 100 - Object.values(newPercentages).reduce((s, p) => s + p, 0);
                } else {
                    newPercentages[k] = Math.round(equalShare);
                }
            });
        }
        
        // Ensure total is exactly 100
        const total = Object.values(newPercentages).reduce((sum, p) => sum + p, 0);
        if (total !== 100 && otherKeys.length > 0) {
            const lastKey = otherKeys[otherKeys.length - 1];
            newPercentages[lastKey] += 100 - total;
        }

        setBlendPercentages(newPercentages);
    };

    const handleRecommendBlend = () => {
        if (blendSelection.fine.length === 0 || blendSelection.coarse.length === 0) {
            toast({ variant: 'destructive', title: "Cannot Recommend Blend", description: "Select at least one fine and one coarse aggregate." });
            return;
        }

        const materials = [
            ...blendSelection.fine.map(f => ({ name: f.fineAggType, passingCurve: new Map(getSievesForType('Fine').map((s, i) => [s, f.results.percentPassing[i]])) })),
            ...blendSelection.coarse.map(c => ({ name: c.type, passingCurve: new Map(getSievesForType(c.type).map((s, i) => [s, c.results.percentPassing[i]])) }))
        ];

        const optimalPercentages = calculateOptimalBlend(materials);
        
        if (optimalPercentages) {
            setBlendPercentages(optimalPercentages);
            toast({ title: "Recommendation Updated", description: "Sliders set to optimal blend." });
        } else {
            toast({ variant: 'destructive', title: "No Optimal Blend Found", description: "Could not find a blend that meets all specification points." });
        }
    };
    
    const combinedChartData = React.useMemo(() => {
        if (!isCombinedTabActive || blendSelection.fine.length === 0 || blendSelection.coarse.length === 0) return [];
        
        let allSieves = new Set<number>();
        const materials = [
            ...blendSelection.fine.map(f => ({
                type: f.fineAggType,
                results: f.results,
                sieves: getSievesForType('Fine'),
                maxSieve: Math.max(...getSievesForType('Fine')),
            })),
            ...blendSelection.coarse.map(c => ({
                type: c.type,
                results: c.results,
                sieves: getSievesForType(c.type),
                maxSieve: Math.max(...getSievesForType(c.type)),
            }))
        ];

        materials.forEach(m => m.sieves.forEach(s => allSieves.add(s)));

        const sortedSieves = Array.from(allSieves).sort((a,b) => b-a);
        
        const data = sortedSieves.map(sieve => {
            let combinedPassing = 0;
            
            materials.forEach(mat => {
                const percentage = blendPercentages[mat.type] ?? 0;
                const passingMap = new Map(mat.sieves.map((s, i) => [s, mat.results.percentPassing[i]]));
                const passing = passingMap.get(sieve) ?? (sieve > mat.maxSieve ? 100 : 0);
                combinedPassing += passing * (percentage / 100);
            });

            const specLimits = getSpecLimitsForType('Coarse - Graded');
            const upperLimit = specLimits?.[sieve]?.max ?? 100;
            const lowerLimit = specLimits?.[sieve]?.min ?? 0;
            
            return {
                sieveSize: sieve,
                combinedPassing: combinedPassing,
                upperLimit: upperLimit,
                lowerLimit: lowerLimit,
                bisLimit: (upperLimit + lowerLimit) / 2,
                recommendedPassing: null,
            };
        });

        return data.sort((a,b) => a.sieveSize - b.sieveSize);

    }, [blendSelection, blendPercentages, isCombinedTabActive]);


    const isReportReady = fineNaturalSandResults || fineCrushedSandResults || coarseGradedResults || coarseSingle10mmResults || coarseSingle20mmResults;

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
                            placeholder="Enter Test Name (e.g., 'Site A - Mix Design')" 
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
                 <Tabs value={activeFineTab} onValueChange={val => setActiveFineTab(val as FineAggregateType)} className="w-full">
                     <TabsList className='mb-4'>
                         <TabsTrigger value="Natural Sand">Natural Sand (River Sand)</TabsTrigger>
                         <TabsTrigger value="Crushed Sand">Crushed Sand</TabsTrigger>
                     </TabsList>
                     <TabsContent value="Natural Sand">
                        <SieveAnalysisForm
                            aggregateType="Fine"
                            onCalculate={handleCalculation(setFineNaturalSandResults)}
                            isLoading={isCalculating}
                            weights={fineNaturalSandWeights}
                            onWeightsChange={setFineNaturalSandWeights}
                            fineAggType="Natural Sand"
                        />
                     </TabsContent>
                     <TabsContent value="Crushed Sand">
                        <SieveAnalysisForm
                            aggregateType="Fine"
                            onCalculate={handleCalculation(setFineCrushedSandResults)}
                            isLoading={isCalculating}
                            weights={fineCrushedSandWeights}
                            onWeightsChange={setFineCrushedSandWeights}
                            fineAggType="Crushed Sand"
                        />
                     </TabsContent>
                 </Tabs>
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
                            onCalculate={handleCalculation(setCoarseGradedResults)}
                            isLoading={isCalculating}
                            weights={coarseGradedWeights}
                            onWeightsChange={setCoarseGradedWeights}
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
                                     onCalculate={handleCalculation(setCoarseSingle20mmResults)}
                                     isLoading={isCalculating}
                                     weights={coarseSingle20mmWeights}
                                     onWeightsChange={setCoarseSingle20mmWeights}
                                 />
                             </TabsContent>
                             <TabsContent value="10mm">
                                 <SieveAnalysisForm
                                     aggregateType="Coarse - 10mm"
                                     onCalculate={handleCalculation(setCoarseSingle10mmResults)}
                                     isLoading={isCalculating}
                                     weights={coarseSingle10mmWeights}
                                     onWeightsChange={setCoarseSingle10mmWeights}
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
                            <CardDescription>Select aggregates and adjust proportions to design your mix. The curve is checked against IS 383 specs for 20mm graded aggregate.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-6 rounded-lg border p-4">
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <div className='space-y-2'>
                                        <h3 className="font-semibold">1. Select Fine Aggregate(s)</h3>
                                        <div className='space-y-2'>
                                            {availableFineAggregates.map(opt => (
                                                <div key={opt.value} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={opt.value}
                                                        checked={!!blendSelection.fine.find(f => f.fineAggType === opt.value)}
                                                        onCheckedChange={(checked) => handleFineSelectionChange(opt.value, !!checked)}
                                                    />
                                                    <label htmlFor={opt.value} className="text-sm font-medium leading-none">
                                                        {opt.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className='space-y-2'>
                                        <h3 className="font-semibold">2. Select Coarse Aggregate(s)</h3>
                                        <div className='space-y-2'>
                                        {availableCoarseAggregates.map(opt => (
                                            <div key={opt.name} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={opt.name}
                                                    checked={!!blendSelection.coarse.find(c => c.type === opt.name)}
                                                    onCheckedChange={(checked) => handleCoarseSelectionChange(opt.name, !!checked)}
                                                />
                                                <label htmlFor={opt.name} className="text-sm font-medium leading-none">
                                                    {opt.name}
                                                </label>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <hr />

                                {blendSelection.fine.length > 0 && blendSelection.coarse.length > 0 && (
                                    <div className='space-y-4'>
                                        <h3 className="font-semibold">3. Adjust Proportions</h3>
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {Object.entries(blendPercentages).map(([key, value]) => (
                                                <div key={key} className="space-y-2">
                                                    <Label>{key} ({value}%)</Label>
                                                    <Slider 
                                                        value={[value]} 
                                                        onValueChange={([val]) => handleSliderChange(val, key)} 
                                                        max={100} 
                                                        step={1} 
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-end">
                                            <Button onClick={handleRecommendBlend}>
                                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                                Recommend Blend
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <CombinedSieveChart data={combinedChartData} />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Calculate one fine and one coarse aggregate to enable this view.</p>
                    </Card>
                )}
            </TabsContent>

            <TabsContent value="report">
                <div id="pdf-content" ref={reportRef}>
                    {isReportReady ? (
                        <ReportLayout 
                            testName={testName}
                            fineNaturalSandResults={fineNaturalSandResults}
                            fineCrushedSandResults={fineCrushedSandResults}
                            coarseGradedResults={coarseGradedResults}
                            coarseSingle10mmResults={coarseSingle10mmResults}
                            coarseSingle20mmResults={coarseSingle20mmResults}
                            fineNaturalSandWeights={(fineNaturalSandWeights || []).map(w => w || 0)}
                            fineCrushedSandWeights={(fineCrushedSandWeights || []).map(w => w || 0)}
                            coarseGradedWeights={(coarseGradedWeights || []).map(w => w || 0)}
                            coarseSingle10mmWeights={(coarseSingle10mmWeights || []).map(w=>w||0)}
                            coarseSingle20mmWeights={(coarseSingle20mmWeights || []).map(w=>w||0)}
                            combinedChartData={combinedChartData}
                            blendSelection={blendSelection}
                            blendPercentages={blendPercentages}
                            showCombined={isCombinedTabActive}
                        />
                    ) : (
                        <Card className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">Calculate results to view the report.</p>
                        </Card>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
}
