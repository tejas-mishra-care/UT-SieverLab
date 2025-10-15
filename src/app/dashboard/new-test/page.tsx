
"use client";

import * as React from "react";
import { SieveAnalysisCalculator } from "@/components/sieve-analysis-calculator";

export default function NewTestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-3xl font-bold">New Sieve Analysis</h2>
        <p className="text-muted-foreground">
          Input data for fine, coarse, or combined aggregates to see live calculations and reports.
        </p>
      </div>
      <SieveAnalysisCalculator />
    </div>
  );
}
