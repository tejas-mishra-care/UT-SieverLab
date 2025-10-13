"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  calculateSieveAnalysis,
  classifyCoarseAggregate,
  classifyFineAggregate,
  SIEVE_SIZES,
} from "@/lib/sieve-analysis";
import type { AggregateType, AnalysisResults } from "@/lib/definitions";
import { SieveResultsDisplay } from "./sieve-results-display";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  type: z.enum(["Fine", "Coarse"], {
    required_error: "You need to select an aggregate type.",
  }),
  weights: z.array(z.object({ value: z.number().min(0, "Weight cannot be negative") })),
});

export function NewTestForm() {
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [analysisResults, setAnalysisResults] = React.useState<AnalysisResults | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "Fine",
      weights: SIEVE_SIZES.FINE.map(() => ({ value: 0 })),
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "weights",
  });

  const aggregateType = form.watch("type") as AggregateType;

  React.useEffect(() => {
    const newSieves = aggregateType === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;
    replace(newSieves.map(() => ({ value: 0 })));
  }, [aggregateType, replace]);

  async function handleCalculate(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResults(null);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate calculation
    try {
      const currentSieves = values.type === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;
      const weights = values.weights.map((w) => w.value);

      const calculated = calculateSieveAnalysis(weights, currentSieves, values.type);
      
      let classification: string;
      if (values.type === 'Fine') {
        classification = classifyFineAggregate(calculated.percentPassing, currentSieves);
      } else {
        classification = classifyCoarseAggregate(calculated.percentPassing, currentSieves);
      }
      
      const finalResults: AnalysisResults = { ...calculated, classification };
      setAnalysisResults(finalResults);
      
      setStep(2);
    } catch (error) {
      console.error("Calculation error:", error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "Could not perform analysis. Please check your inputs and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!analysisResults) return;
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate saving
    
    // In a real app, you would save this to a database
    console.log("Saving test...", {
      type: aggregateType,
      results: analysisResults,
      weights: form.getValues('weights').map(w => w.value)
    });
    
    setIsSaving(false);
    toast({
        title: "Test Saved Successfully",
        description: "Your sieve analysis has been saved to your dashboard.",
    });
    router.push('/dashboard');
  }

  const currentSieves = aggregateType === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleCalculate)}>
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Aggregate Type</CardTitle>
                <CardDescription>Select the type of aggregate you are testing.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Fine" />
                            </FormControl>
                            <FormLabel className="font-normal">Fine Aggregate</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Coarse" />
                            </FormControl>
                            <FormLabel className="font-normal">Coarse Aggregate</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Enter Weights</CardTitle>
                <CardDescription>
                  Enter the weight (in grams) retained on each sieve.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sieve Size (mm)</TableHead>
                      <TableHead>Weight Retained (g)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{currentSieves[index]}</TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`weights.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    {...field}
                                    onChange={event => field.onChange(event.target.value === '' ? 0 : parseFloat(event.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="mr-2 h-4 w-4" />
                )}
                Calculate & Analyze
              </Button>
            </div>
          </div>
        )}
      </form>

      {step === 2 && analysisResults && (
        <div className="space-y-6">
           <SieveResultsDisplay 
              sieves={currentSieves}
              results={analysisResults}
              type={aggregateType}
            />
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back to Inputs
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Test
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
}
