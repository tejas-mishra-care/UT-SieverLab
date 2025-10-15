
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CombinedSieveChart } from './combined-sieve-chart';
import { Slider } from './ui/slider';

const ALL_SIEVES = [0.15, 0.3, 0.6, 1.18, 2.36, 4.75, 10, 20, 40, 63, 80].reverse();

// Example IS 383 Table 7 limits for 20mm nominal size graded aggregate
const SPEC_LIMITS: Record<number, { min: number; max: number }> = {
    80: { min: 100, max: 100 },
    63: { min: 100, max: 100 },
    40: { min: 95, max: 100 },
    20: { min: 90, max: 100 },
    10: { min: 25, max: 55 },
    4.75: { min: 0, max: 10 },
    2.36: { min: 0, max: 5 },
    1.18: { min: 0, max: 0 },
    0.6: { min: 0, max: 0 },
    0.3: { min: 0, max: 0 },
    0.15: { min: 0, max: 0 },
};

const DEFAULT_FINE_PASSING: Record<number, number> = {
    10: 100,
    4.75: 95,
    2.36: 80,
    1.18: 60,
    0.6: 40,
    0.3: 15,
    0.15: 5,
};

const DEFAULT_COARSE_PASSING: Record<number, number> = {
    40: 100,
    20: 98,
    10: 30,
    4.75: 5,
};


export function GradationAnalysis() {
    const [finePassing, setFinePassing] = useState<Record<string, number>>(
        Object.fromEntries(ALL_SIEVES.map(s => [s.toString(), DEFAULT_FINE_PASSING[s] ?? (s > 10 ? 100 : 0)]))
    );
    const [coarsePassing, setCoarsePassing] = useState<Record<string, number>>(
        Object.fromEntries(ALL_SIEVES.map(s => [s.toString(), DEFAULT_COARSE_PASSING[s] ?? (s > 40 ? 100 : 0)]))
    );
    const [fineAggregatePercentage, setFineAggregatePercentage] = useState(35);

    const handleInputChange = (
        sieve: number,
        value: string,
        setter: React.Dispatch<React.SetStateAction<Record<string, number>>>
    ) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            setter(prev => ({ ...prev, [sieve.toString()]: numValue }));
        }
    };
    
    const coarseAggregatePercentage = 100 - fineAggregatePercentage;

    const chartData = useMemo(() => {
        return ALL_SIEVES.map(sieve => {
            const fineP = finePassing[sieve.toString()] || 0;
            const coarseP = coarsePassing[sieve.toString()] || 0;
            
            const combinedPassing = (fineP * (fineAggregatePercentage / 100)) + (coarseP * (coarseAggregatePercentage / 100));

            return {
                sieveSize: sieve,
                combinedPassing: combinedPassing,
                upperLimit: SPEC_LIMITS[sieve].max,
                lowerLimit: SPEC_LIMITS[sieve].min,
            };
        }).sort((a,b) => a.sieveSize - b.sieveSize);
    }, [finePassing, coarsePassing, fineAggregatePercentage, coarseAggregatePercentage]);

    const complianceStatus = useMemo(() => {
        return chartData.map(d => {
            const isCompliant = d.combinedPassing >= d.lowerLimit && d.combinedPassing <= d.upperLimit;
            return {
                sieveSize: d.sieveSize,
                isCompliant: isCompliant,
            }
        });
    }, [chartData]);
    
    const finenessModulus = useMemo(() => {
        const fmSieves = [4.75, 2.36, 1.18, 0.6, 0.3, 0.15];
        const cumulativeRetainedSum = fmSieves.reduce((sum, sieve) => {
            const passing = finePassing[sieve.toString()] ?? 0;
            const retained = 100 - passing;
            return sum + retained;
        }, 0);
        return (cumulativeRetainedSum / 100).toFixed(2);
    }, [finePassing]);


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Gradation Inputs</CardTitle>
                        <CardDescription>
                            Enter the % Passing for fine and coarse aggregates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px] font-bold">Sieve (mm)</TableHead>
                                        <TableHead className="font-bold">Fine Agg. (% Passing)</TableHead>
                                        <TableHead className="font-bold">Coarse Agg. (% Passing)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...ALL_SIEVES].reverse().map(sieve => (
                                        <TableRow key={sieve}>
                                            <TableCell className="font-medium">{sieve}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={finePassing[sieve.toString()] || ''}
                                                    onChange={(e) => handleInputChange(sieve, e.target.value, setFinePassing)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={coarsePassing[sieve.toString()] || ''}
                                                    onChange={(e) => handleInputChange(sieve, e.target.value, setCoarsePassing)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mix Proportions</CardTitle>
                             <CardDescription>
                                Adjust the blend of fine and coarse aggregates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4 pt-4'>
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
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                           <CardTitle>Analysis Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <p className="text-sm font-medium text-muted-foreground">Fine Aggregate FM</p>
                             <p className="text-2xl font-bold">{finenessModulus}</p>
                           </div>
                           <div className="space-y-1">
                             <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                              <p className={`text-2xl font-bold ${complianceStatus.every(s => s.isCompliant) ? 'text-green-600' : 'text-destructive'}`}>
                                {complianceStatus.every(s => s.isCompliant) ? 'Pass' : 'Fail'}
                              </p>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Combined Gradation Curve</CardTitle>
                    <CardDescription>
                        Analysis of the blended aggregate against specification limits for 20mm nominal size graded aggregate.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CombinedSieveChart data={chartData} />
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Compliance Check</CardTitle>
                    <CardDescription>
                       Detailed check of the combined gradation against each sieve's limits.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sieve (mm)</TableHead>
                                <TableHead>% Passing</TableHead>
                                <TableHead>Lower Limit</TableHead>
                                <TableHead>Upper Limit</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {complianceStatus.map(({ sieveSize, isCompliant }) => {
                                const dataPoint = chartData.find(d => d.sieveSize === sieveSize);
                                if (!dataPoint) return null;
                                return (
                                <TableRow key={sieveSize} className={!isCompliant ? 'bg-destructive/10' : ''}>
                                    <TableCell>{sieveSize}</TableCell>
                                    <TableCell>{dataPoint.combinedPassing.toFixed(2)}</TableCell>
                                    <TableCell>{dataPoint.lowerLimit}</TableCell>
                                    <TableCell>{dataPoint.upperLimit}</TableCell>
                                    <TableCell className={`font-bold ${isCompliant ? 'text-green-600' : 'text-destructive'}`}>
                                        {isCompliant ? 'OK' : 'Fail'}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
