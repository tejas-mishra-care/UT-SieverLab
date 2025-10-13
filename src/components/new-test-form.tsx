
"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { doc, setDoc, collection } from "firebase/firestore";
import { SieveInputsDisplay } from "./sieve-inputs-display";

const formSchema = z.object({
  name: z.string().min(1, "Test name is required."),
  type: z.enum(["Fine", "Coarse"], {
    required_error: "You need to select an aggregate type.",
  }),
  weights: z.array(z.object({ value: z.number().min(0, "Weight cannot be negative").nullable() })),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTestFormProps {
  existingTest?: SieveAnalysisTest | null;
}

const getSievesForType = (type: AggregateType) => SIEVE_SIZES[type.toUpperCase() as keyof typeof SIEVE_SIZES] || [];

export function NewTestForm({ existingTest }: NewTestFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const isEditMode = !!existingTest;

  const [step, setStep] = React.useState(1);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [analysisResults, setAnalysisResults] = React.useState<AnalysisResults | null>(null);

  const defaultValues = React.useMemo(() => {
    const type = existingTest?.type || 'Fine';
    const sieves = getSievesForType(type);
    return {
      name: existingTest?.name || '',
      type: type,
      weights: sieves.map((_, index) => ({
        value: existingTest?.weights?.[index] ?? null,
      })),
    };
  }, [existingTest]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "weights",
  });

  const aggregateType = form.watch("type") as AggregateType;

  React.useEffect(() => {
    if (existingTest) {
      form.reset(defaultValues);

      if (existingTest.status === 'completed') {
        setAnalysisResults({
          percentRetained: existingTest.percentRetained,
          cumulativeRetained: existingTest.cumulativeRetained,
          percentPassing: existingTest.percentPassing,
          finenessModulus: existingTest.finenessModulus,
          classification: existingTest.classification,
        });
        setStep(2);
      }
    }
  }, [existingTest, form, defaultValues]);

  React.useEffect(() => {
    const newSieves = getSievesForType(aggregateType);
    const newWeights = newSieves.map(() => ({ value: null }));
    replace(newWeights);
    setAnalysisResults(null);
    if(step === 2) setStep(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggregateType, replace]);


  async function handleCalculate(values: FormValues) {
    setIsCalculating(true);
    setAnalysisResults(null);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const currentSieves = getSievesForType(values.type);
      const weights = values.weights.map((w) => w.value || 0);

      if (weights.reduce((a, b) => a + b, 0) <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Total weight must be greater than zero.",
        });
        setIsCalculating(false);
        return;
      }

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

  async function handleSave() {
    if (!analysisResults || !user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot save. You must be logged in and have analysis results.",
      });
      return;
    };
    setIsSaving(true);

    const currentSieves = getSievesForType(aggregateType);
    const weights = form.getValues('weights').map(w => w.value || 0);

    const testId = isEditMode ? existingTest.id : doc(collection(firestore, "tests")).id;

    const testData: SieveAnalysisTest = {
      id: testId,
      userId: user.uid,
      name: form.getValues("name"),
      type: aggregateType,
      timestamp: isEditMode ? existingTest.timestamp : Date.now(),
      status: 'completed',
      sieves: currentSieves,
      weights: weights,
      percentRetained: analysisResults.percentRetained,
      cumulativeRetained: analysisResults.cumulativeRetained,
      percentPassing: analysisResults.percentPassing,
      finenessModulus: analysisResults.finenessModulus,
      classification: analysisResults.classification,
    };

    try {
      const testDocRef = doc(firestore, 'tests', testData.id);
      await setDoc(testDocRef, testData, { merge: true });

      toast({
        title: isEditMode ? "Test Updated" : "Test Saved",
        description: `"${testData.name}" has been successfully saved.`,
      });
      router.push(`/dashboard/test/${testData.id}`);
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

  const currentSieves = getSievesForType(aggregateType);

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
                      <FormLabel htmlFor="testName">Test Name</FormLabel>
                      <FormControl>
                        <Input id="testName" placeholder="e.g., 'Sample from Site A'" {...field} autoComplete="off" />
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
                            field.onChange(value as AggregateType);
                          }}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Fine" id="typeFine" />
                            </FormControl>
                            <FormLabel htmlFor="typeFine" className="font-normal">Fine Aggregate</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Coarse" id="typeCoarse" />
                            </FormControl>
                            <FormLabel htmlFor="typeCoarse" className="font-normal">Coarse Aggregate</FormLabel>
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
                            <Controller
                              control={form.control}
                              name={`weights.${index}.value`}
                              render={({ field: controllerField, fieldState }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      placeholder="Enter weight"
                                      {...controllerField}
                                      value={controllerField.value ?? ""}
                                      onChange={event => controllerField.onChange(event.target.value === '' ? null : parseFloat(event.target.value))}
                                      className="max-w-sm"
                                      id={`weight-${index}`}
                                      name={`weight-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage>
                                    {fieldState.error?.message}
                                  </FormMessage>
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
           <div ref={null}>
            <div className="mb-6 border-b pb-4">
                <h1 className="font-headline text-2xl font-bold">{form.getValues("name")}</h1>
                <p className="text-sm text-muted-foreground">
                    Sieve Analysis Report &bull;{" "}
                    {new Date(isEditMode && existingTest ? existingTest.timestamp : Date.now()).toLocaleDateString()}
                </p>
            </div>
            <SieveInputsDisplay sieves={currentSieves} weights={form.getValues('weights').map(w => w.value || 0)} />
            <SieveResultsDisplay
                sieves={currentSieves}
                type={aggregateType}
                {...analysisResults}
            />
          </div>
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back to Inputs
            </Button>

            <Button onClick={handleSave} disabled={isSaving || !user}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditMode ? 'Update Test' : 'Save Test'}
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
}
