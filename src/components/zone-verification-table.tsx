
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
import { ZONING_LIMITS } from "@/lib/sieve-analysis";
import { cn } from "@/lib/utils";

interface ZoneVerificationTableProps {
  sieves: number[];
  percentPassing: number[];
  bestFitZone: string;
}

export function ZoneVerificationTable({
  sieves,
  percentPassing,
  bestFitZone,
}: ZoneVerificationTableProps) {
  const zoneLimits = ZONING_LIMITS[bestFitZone];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zone Classification Verification</CardTitle>
        <CardDescription>
          The sample does not fully conform to any single grading zone. The
          table below compares the sample against the closest-matching zone (
          <span className="font-semibold">{bestFitZone}</span>) to show where
          it fails.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">IS Sieve</TableHead>
                <TableHead className="font-bold text-right">
                  Sample % Passing
                </TableHead>
                <TableHead className="font-bold text-center">
                  {bestFitZone} Limits (% Passing)
                </TableHead>
                <TableHead className="font-bold text-center">Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sieves.map((sieve, index) => {
                const limits = zoneLimits[sieve];
                const passingValue = percentPassing[index];
                const isOutOfSpec =
                  limits ? passingValue < limits.min || passingValue > limits.max : false;

                return (
                  <TableRow
                    key={sieve}
                    className={cn(isOutOfSpec && "bg-destructive/10")}
                  >
                    <TableCell className="font-medium">{sieve} mm</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        isOutOfSpec && "text-destructive"
                      )}
                    >
                      {passingValue.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {limits ? `${limits.min} - ${limits.max}` : "N/A"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center font-medium",
                        isOutOfSpec ? "text-destructive" : "text-green-600"
                      )}
                    >
                      {isOutOfSpec ? "FAIL" : "Pass"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
            <b>Conclusion:</b> Because the % Passing for one or more sieves falls outside the required range for {bestFitZone}, the sample cannot be classified as such. This type of aggregate is often known as "gap-graded".
        </p>
      </CardContent>
    </Card>
  );
}
