
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
import type { AggregateType, AnalysisResults } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, WandSparkles } from "lucide-react";

const formSchema = z.object({
  weights: z.array(z.object({ value: z.number().min(0, "Weight cannot be negative").nullable() })),
});

type FormValues = z.infer<typeof formSchema>;

interface SieveAnalysisFormProps {
  aggregateType: AggregateType;
  onCalculate: (results: AnalysisResults, weights: number[]) => void;
  isLoading: boolean;
  initialWeights: (number | null)[];
}

const getSievesForType = (type: AggregateType) => SIEVE_SIZES[type.toUpperCase() as keyof typeof SIEVE_SIZES] || [];

export function SieveAnalysisForm({ aggregateType, onCalculate, isLoading, initialWeights }: SieveAnalysisFormProps) {
  const { toast } = useToast();
  const currentSieves = getSievesForType(aggregateType);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weights: Array(currentSieves.length + 1).fill({ value: null }),
    },
    reValidateMode: "onChange",
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "weights",
  });

  React.useEffect(() => {
    const newSieves = getSievesForType(aggregateType);
    const newWeights = newSieves.map((_, index) => ({ value: initialWeights[index] ?? null }));
    // Add pan
    newWeights.push({ value: initialWeights[newSieves.length] ?? null });
    replace(newWeights);
  }, [aggregateType, replace, initialWeights]);


  function handleCalculate(values: FormValues) {
    try {
      const weights = values.weights.map((w) => w.value || 0);

      if (weights.reduce((a, b) => a + b, 0) <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Total weight must be greater than zero.",
        });
        return;
      }

      // Pass all weights (including pan) to calculation
      const calculated = calculateSieveAnalysis(weights.slice(0, currentSieves.length + 1));
      
      let classification: string;
      if (aggregateType === 'Fine') {
        classification = classifyFineAggregate(calculated.percentPassing, currentSieves);
      } else {
        classification = classifyCoarseAggregate(calculated.percentPassing, currentSieves);
      }
      
      const fm = aggregateType === "Fine" ? (calculated.cumulativeRetained.reduce((a, b) => a + b, 0) / 100) : null;
      
      const finalResults: AnalysisResults = {
        ...calculated,
        classification,
        finenessModulus: fm
      };

      onCalculate(finalResults, weights);

    } catch (error) {
      console.error("Calculation error:", error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "Could not perform analysis. Please check your inputs.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleCalculate)}>
        <Card>
          <CardHeader>
            <CardTitle>{aggregateType} Aggregate Details</CardTitle>
            <CardDescription>
              Enter the weight (in grams) retained on each sieve and in the pan for the {aggregateType.toLowerCase()} aggregate.
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
                      <TableCell className="font-medium">
                        {index < currentSieves.length ? currentSieves[index] : 'Pan'}
                      </TableCell>
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
                                  autoComplete="off"
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
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="mr-2 h-4 w-4" />
                )}
                Calculate {aggregateType} Aggregate
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
