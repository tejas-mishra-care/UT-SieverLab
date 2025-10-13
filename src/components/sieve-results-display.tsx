
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
import type { AnalysisResults, AggregateType } from "@/lib/definitions";
import { BrainCircuit, FlaskConical } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useState } from "react";
import { recommendMaterials, MaterialRecommendationsInput } from "@/ai/flows/material-recommendations";
import { Button } from "./ui/button";
import { Loader2, WandSparkles } from "lucide-react";

interface SieveResultsDisplayProps {
  sieves: number[];
  results: AnalysisResults;
  type: AggregateType;
}

export function SieveResultsDisplay({
  sieves,
  results,
  type,
}: SieveResultsDisplayProps) {
  const chartData = sieves.map((sieve, index) => ({
    sieveSize: sieve,
    percentPassing: results.percentPassing[index],
  }));

  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const getRecommendations = async () => {
    setIsGenerating(true);
    setRecommendations(null);
    try {
        const input: MaterialRecommendationsInput = {
            aggregateType: type,
            finenessModulus: results.finenessModulus || 0,
            classification: results.classification || "N/A",
            sieveSizes: sieves,
            percentPassing: results.percentPassing,
        };
        const response = await recommendMaterials(input);
        setRecommendations(response.recommendations);
    } catch (e) {
        console.error(e);
        setRecommendations("Sorry, I was unable to generate recommendations for this material.");
    } finally {
        setIsGenerating(false);
    }
};

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
            <CardTitle className="text-sm font-medium">Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.classification || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fineness Modulus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.finenessModulus?.toFixed(2) || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="data">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data">
            <FlaskConical className="mr-2 h-4 w-4" />
            Analysis Data
          </TabsTrigger>
          <TabsTrigger value="ai">
            <BrainCircuit className="mr-2 h-4 w-4" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="data">
            <div className="space-y-6 mt-4">
            <Card>
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
                <CardTitle>Raw Data</CardTitle>
                <CardDescription>
                    Detailed results from the sieve analysis.
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
                            {results.percentRetained[index].toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                            {results.cumulativeRetained[index].toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                            {results.percentPassing[index].toFixed(2)}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                </CardContent>
            </Card>
            </div>
        </TabsContent>
        <TabsContent value="ai">
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>AI-Powered Material Recommendations</CardTitle>
                    <CardDescription>
                        Based on IS 383 standards, here are the suitable applications for this aggregate.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!recommendations && !isGenerating && (
                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                            <p className="mb-4 text-muted-foreground">Click the button to get AI-powered recommendations for your material.</p>
                            <Button onClick={getRecommendations} disabled={isGenerating}>
                                {isGenerating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <WandSparkles className="mr-2 h-4 w-4" />
                                )}
                                Generate Recommendations
                            </Button>
                        </div>
                    )}
                    {isGenerating && (
                        <div className="flex items-center space-x-2">
                           <Loader2 className="h-5 w-5 animate-spin text-primary" />
                           <p className="text-muted-foreground">Generating recommendations...</p>
                        </div>
                    )}
                    {recommendations && (
                        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                            <p>{recommendations}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
