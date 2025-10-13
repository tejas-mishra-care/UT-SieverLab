
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
import type { AggregateType, AnalysisResults, SieveAnalysisTest } from "@/lib/definitions";
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
import { useFirestore, useUser } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useDebouncedCallback } from "use-debounce";

const formSchema = z.object({
  name: z.string().min(1, "Test name is required."),
  type: z.enum(["Fine", "Coarse"], {
    required_error: "You need to select an aggregate type.",
  }),
  weights: z.array(z.object({ value: z.number().min(0, "Weight cannot be negative").nullable() })),
});

interface NewTestFormProps {
  existingTest: SieveAnalysisTest; // Changed to be required
}

export function NewTestForm({ existingTest }: NewTestFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const [step, setStep] = React.useState(existingTest.status === 'completed' ? 2 : 1);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'saved' | 'saving' | 'unsaved'>('saved');

  const [analysisResults, setAnalysisResults] = React.useState<AnalysisResults | null>(
    existingTest.status === 'completed' ? {
      percentRetained: existingTest.percentRetained,
      cumulativeRetained: existingTest.cumulativeRetained,
      percentPassing: existingTest.percentPassing,
      finenessModulus: existingTest.finenessModulus,
      classification: existingTest.classification,
    } : null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingTest.name,
      type: existingTest.type,
      weights: (SIEVE_SIZES[existingTest.type] || SIEVE_SIZES.FINE).map(
        (_, index) => ({ value: existingTest.weights[index] ?? null })
      ),
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "weights",
  });

  const aggregateType = form.watch("type") as AggregateType;
  const formValues = form.watch();

  const debouncedSave = useDebouncedCallback(async (data: SieveAnalysisTest) => {
    if (!firestore || !user) return;
    setSaveStatus('saving');
    const testDocRef = doc(firestore, 'tests', existingTest.id);
    try {
      await setDoc(testDocRef, data, { merge: true });
      setSaveStatus('saved');
    } catch (error) {
      console.error("Autosave error:", error);
      toast({ variant: 'destructive', title: 'Autosave Failed' });
      setSaveStatus('unsaved');
    }
  }, 2000); // 2-second debounce

  React.useEffect(() => {
    setSaveStatus('unsaved');
    const currentSieves = SIEVE_SIZES[formValues.type as AggregateType] || [];
    const weights = formValues.weights.map(w => w.value ?? 0);
    const updatedData: Partial<SieveAnalysisTest> = {
      name: formValues.name,
      type: formValues.type as AggregateType,
      weights: weights,
      sieves: currentSieves,
    };
    debouncedSave(updatedData as SieveAnalysisTest);
  }, [formValues, debouncedSave]);


  React.useEffect(() => {
    const newSieves = aggregateType === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;
    replace(newSieves.map(() => ({ value: null })));
    setAnalysisResults(null);
    form.reset({
        name: form.getValues('name'),
        type: aggregateType,
        weights: newSieves.map(() => ({ value: null }))
    });
  }, [aggregateType, replace]);


  async function handleCalculate(values: z.infer<typeof formSchema>) {
    setIsCalculating(true);
    setAnalysisResults(null);
    await new Promise(resolve => setTimeout(resolve, 500)); 
    try {
      const currentSieves = values.type === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;
      const weights = values.weights.map((w) => w.value || 0);

      const calculated = calculateSieveAnalysis(weights);
      
      let classification: string;
      if (values.type === 'Fine') {
        classification = classifyFineAggregate(calculated.percentPassing, currentSieves);
      } else {
        classification = classifyCoarseAggregate(calculated.percentPassing, currentSieves);
      }
      
      const fm = values.type === "Fine" ? (calculated.cumulativeRetained.reduce((a, b) => a + b, 0) / 100) : null;
      
      const finalResults: AnalysisResults = { 
        ...calculated, 
        classification,
        finenessModulus: fm
      };
      
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
      setIsCalculating(false);
    }
  }

  async function handleCompleteTest() {
    if (!analysisResults || !user || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Cannot save. You must be logged in and have analysis results.",
        });
        return;
    };
    setIsSaving(true);
    setSaveStatus('saving');
    
    const currentSieves = aggregateType === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;
    const weights = form.getValues('weights').map(w => w.value || 0);

    const testData: SieveAnalysisTest = {
      ...existingTest,
      name: form.getValues("name"),
      type: aggregateType,
      sieves: currentSieves,
      weights: weights,
      percentRetained: analysisResults.percentRetained,
      cumulativeRetained: analysisResults.cumulativeRetained,
      percentPassing: analysisResults.percentPassing,
      finenessModulus: analysisResults.finenessModulus,
      classification: analysisResults.classification,
      status: 'completed',
      timestamp: existingTest.timestamp || Date.now() // Keep original timestamp
    };
    
    try {
      const testDocRef = doc(firestore, 'tests', existingTest.id);
      await setDoc(testDocRef, testData, { merge: true });
      setSaveStatus('saved');
      toast({
        title: "Test Completed",
        description: `"${testData.name}" has been saved.`,
      });
      router.push(`/dashboard/test/${existingTest.id}`);
      router.refresh(); 
    } catch (error) {
      setSaveStatus('unsaved');
      console.error("Firestore save error:", error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "Could not save the test. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const currentSieves = aggregateType === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;
  
  const getSaveStatusMessage = () => {
    switch (saveStatus) {
      case 'saving':
        return <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Saving...</>;
      case 'saved':
        return <>All changes saved</>;
      case 'unsaved':
        return <>Unsaved changes</>;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleCalculate)}>
        {step === 1 && (
          <div className="space-y-6">
             <Card>
              <CardHeader>
                <CardTitle>Step 1: Test Details</CardTitle>
                <CardDescription>Enter a name for your test and select the aggregate type.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 'Sample from Site A'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                       <FormLabel>Aggregate Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
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
                  Enter the weight (in grams) retained on each sieve. Leave blank or enter 0 if not used.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[150px]">Sieve Size (mm)</TableHead>
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
                                        placeholder="Enter weight"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={event => field.onChange(event.target.value === '' ? null : parseFloat(event.target.value))}
                                        className="max-w-sm"
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
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">{getSaveStatusMessage()}</span>
              <Button type="submit" disabled={isCalculating}>
                {isCalculating ? (
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
              type={aggregateType}
              {...analysisResults}
            />
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => { setStep(1); }}>
                Back to Inputs
            </Button>

            <Button onClick={handleCompleteTest} disabled={isSaving || !user}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {existingTest.status === 'completed' ? 'Save Changes' : 'Complete and Save Test'}
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
}
