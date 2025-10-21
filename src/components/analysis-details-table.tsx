
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AnalysisDetailsTableProps {
  title: string;
  description: string;
  data: {
    sieveSize: number;
    percentPassing: number;
  }[];
  specLimits: Record<number, { min: number; max: number }> | null;
}

export function AnalysisDetailsTable({ data, specLimits, title, description }: AnalysisDetailsTableProps) {
  const sortedData = [...data].sort((a, b) => b.sieveSize - a.sieveSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Sieve (mm)</TableHead>
                {specLimits && <TableHead className="font-bold text-right">Lower Limit (%)</TableHead>}
                {specLimits && <TableHead className="font-bold text-right">Upper Limit (%)</TableHead>}
                <TableHead className="font-bold text-right">% Passing</TableHead>
                {specLimits && <TableHead className="font-bold text-center">Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => {
                const limits = specLimits ? specLimits[row.sieveSize] : null;
                const isOutOfSpec = limits 
                  ? row.percentPassing < limits.min || row.percentPassing > limits.max 
                  : false;

                return (
                  <TableRow key={row.sieveSize} className={cn(isOutOfSpec && "bg-destructive/10")}>
                    <TableCell className="font-medium">{row.sieveSize}</TableCell>
                    {specLimits && <TableCell className="text-right">{limits?.min.toFixed(2) ?? "N/A"}</TableCell>}
                    {specLimits && <TableCell className="text-right">{limits?.max.toFixed(2) ?? "N/A"}</TableCell>}
                    <TableCell className={cn("text-right font-semibold", isOutOfSpec && "text-destructive")}>
                      {row.percentPassing.toFixed(2)}
                    </TableCell>
                    {specLimits && (
                      <TableCell className="text-center">
                        {isOutOfSpec ? (
                          <Badge variant="destructive">Out of Spec</Badge>
                        ) : (
                          <Badge variant="secondary">In Spec</Badge>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
