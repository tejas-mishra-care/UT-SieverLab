
"use client";

import { GradationAnalysis } from "@/components/gradation-analysis";

export default function GradationAnalysisPage() {
  return (
    <div className="space-y-6">
       <div>
        <h2 className="font-headline text-3xl font-bold">Legacy Gradation Analysis</h2>
        <p className="text-muted-foreground">
          This is the old gradation analysis tool. The new tool is under 'New Test'.
        </p>
      </div>
      <GradationAnalysis />
    </div>
  );
}
