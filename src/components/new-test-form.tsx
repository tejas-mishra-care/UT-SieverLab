
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
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(1, "Test name is required."),
  type: z.enum(["Fine", "Coarse"], {
    required_error: "You need to select an aggregate type.",
  }),
  weights: z.array(z.object({ value: z.number().min(0, "Weight cannot be negative").nullable() })),
});

interface NewTestFormProps {
  existingTest?: SieveAnalysisTest;
}

export function NewTestForm({ existingTest }: NewTestFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [analysisResults, setAnalysisResults] = React.useState<AnalysisResults | null>(
    existingTest?.results || null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingTest?.name || "",
      type: existingTest?.type || "Fine",
      weights: (existingTest?.weights || SIEVE_SIZES.FINE.map(() => null)).map(
        (w) => ({ value: w })
      ),
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "weights",
  });

  const aggregateType = form.watch("type") as AggregateType;

  React.useEffect(() => {
    // Only reset if it's a new test form
    if (!existingTest) {
      const newSieves = aggregateType === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;
      replace(newSieves.map(() => ({ value: null })));
      setAnalysisResults(null);
    }
  }, [aggregateType, replace, existingTest]);

  React.useEffect(() => {
    if (existingTest) {
       setStep(2);
    }
  }, [existingTest])


  async function handleCalculate(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResults(null);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate calculation
    try {
      const currentSieves = values.type === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;
      const weights = values.weights.map((w) => w.value || 0);

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
    if (!analysisResults || !user || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to save a test.",
        });
        return;
    };
    setIsSaving(true);
    
    const currentSieves = aggregateType === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;

    const testData: Omit<SieveAnalysisTest, 'id'> = {
      userId: user.uid,
      name: form.getValues("name"),
      type: aggregateType,
      timestamp: existingTest?.timestamp || Date.now(),
      sieves: currentSieves,
      weights: form.getValues('weights').map(w => w.value || 0),
      results: analysisResults,
    };
    
    try {
        if (existingTest) {
          const testDocRef = doc(firestore, 'tests', existingTest.id);
          await setDoc(testDocRef, testData);
          toast({
            title: "Test Updated Successfully",
            description: `"${testData.name}" has been updated.`,
        });
        router.push(`/dashboard/test/${existingTest.id}`);
        } else {
            const testsCollection = collection(firestore, 'tests');
            const docRef = await addDoc(testsCollection, testData);
            
            toast({
                title: "Test Saved Successfully",
                description: `"${testData.name}" has been saved to your dashboard.`,
            });
            router.push(`/dashboard/test/${docRef.id}`);
        }
    } catch (error) {
        console.error("Firestore save error:", error);
        toast({
            variant: "destructive",
            title: "An Error Occurred",
            description: "Could not save the test. Please try again.",
        });
        setIsSaving(false);
    } 
  }

  const currentSieves = aggregateType === "Fine" ? SIEVE_SIZES.FINE : SIEVE_SIZES.COARSE;

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
              <CardContent className="space-y-4">
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
                  Enter the weight (in grams) retained on each sieve. Leave blank if not used.
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
            <div>
                 <Button variant="outline" onClick={() => { setStep(1); }}>
                    Back to Inputs
                </Button>
                {existingTest && (
                    <Button variant="ghost" asChild className="ml-2">
                        <Link href={`/dashboard/test/${existingTest.id}`}>Cancel</Link>
                    </Button>
                )}
            </div>

            <Button onClick={handleSave} disabled={isSaving || !user}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {existingTest ? 'Save Changes' : 'Save Test'}
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
}
