import { notFound } from "next/navigation";
import { mockTests } from "@/lib/mock-data";
import { SieveResultsDisplay } from "@/components/sieve-results-display";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import Link from "next/link";

export default function TestViewPage({ params }: { params: { id: string } }) {
  const test = mockTests.find((t) => t.id === params.id);

  if (!test) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-headline text-3xl font-bold">
            Test Details <span className="text-primary">#{test.id.slice(-6)}</span>
          </h2>
          <p className="text-muted-foreground">
            Completed on {new Date(test.timestamp).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href={test.reportUrl || "#"} target="_blank">
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                </Link>
            </Button>
            <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </Button>
        </div>
      </div>
      
      <SieveResultsDisplay
        sieves={test.sieves}
        results={test.results}
        recommendation={test.recommendation}
        type={test.type}
      />
    </div>
  );
}
