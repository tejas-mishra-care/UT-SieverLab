
"use client";

import { GradationAnalysis } from "@/components/gradation-analysis";

export default function GradationAnalysisPage() {
  return (
    <div className="space-y-6">
       <div>
        <h2 className="font-headline text-3xl font-bold">Gradation Analysis</h2>
        <p className="text-muted-foreground">
          Analyze combined aggregate gradations and perform what-if analysis.
        </p>
      </div>
      <GradationAnalysis />
    </div>
  );
}
