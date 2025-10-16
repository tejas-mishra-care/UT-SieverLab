
"use client";

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

interface SieveInputsDisplayProps {
  sieves: number[];
  weights: number[];
}

export function SieveInputsDisplay({ sieves, weights }: SieveInputsDisplayProps) {
  const totalWeight = weights.reduce((acc, w) => acc + (w || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Inputs</CardTitle>
        <CardDescription>
          The raw weights entered for the analysis. Total sample weight: {totalWeight.toFixed(1)}g.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Sieve Size (mm)</TableHead>
                <TableHead className="font-bold text-right">
                  Weight Retained (g)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sieves.map((sieve, index) => (
                <TableRow key={sieve}>
                  <TableCell className="font-medium">{sieve}</TableCell>
                  <TableCell className="text-right">
                    {(weights?.[index] ?? 0).toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
               <TableRow>
                  <TableCell className="font-medium">Pan</TableCell>
                  <TableCell className="text-right">
                    {(weights?.[sieves.length] ?? 0).toFixed(1)}
                  </TableCell>
                </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
