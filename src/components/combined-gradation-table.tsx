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

interface CombinedGradationTableProps {
  data: {
    sieveSize: number;
    combinedPassing: number;
    upperLimit: number;
    lowerLimit: number;
    bisLimit: number;
  }[];
}

export function CombinedGradationTable({ data }: CombinedGradationTableProps) {
  const sortedData = [...data].sort((a, b) => b.sieveSize - a.sieveSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Combined Gradation Data</CardTitle>
        <CardDescription>
          Detailed data points for the combined aggregate blend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Sieve (mm)</TableHead>
                <TableHead className="font-bold text-right">Combined Passing (%)</TableHead>
                <TableHead className="font-bold text-right">BIS Ideal Limit (%)</TableHead>
                <TableHead className="font-bold text-center">Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => {
                const isOutOfSpec =
                  row.combinedPassing < row.lowerLimit ||
                  row.combinedPassing > row.upperLimit;
                
                return (
                  <TableRow 
                    key={row.sieveSize} 
                    className={cn(isOutOfSpec && "bg-destructive/10")}
                  >
                    <TableCell className="font-medium">{row.sieveSize}</TableCell>
                    <TableCell className={cn("text-right font-semibold", isOutOfSpec && "text-destructive")}>
                      {row.combinedPassing.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{row.bisLimit.toFixed(2)}</TableCell>
                    <TableCell className={cn("text-center font-medium", isOutOfSpec ? "text-destructive" : "text-green-600")}>
                      {isOutOfSpec ? 'FAIL' : 'Pass'}
                    </TableCell>
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
