"use client";

import { notFound, useRouter } from "next/navigation";
import { SieveResultsDisplay } from "@/components/sieve-results-display";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import Link from "next/link";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { mockTests } from "@/lib/mock-data";
import React from "react";

export default function TestViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();

  const [test, setTest] = React.useState<SieveAnalysisTest | undefined>(undefined);
  
  React.useEffect(() => {
    const foundTest = mockTests.find(t => t.id === params.id);
    if(foundTest) {
      setTest(foundTest);
    } else {
      notFound();
    }
  }, [params.id]);


  const handleDelete = async () => {
    if (!test) return;
    toast({title: "Test Deleted", description: `Test #${test.id.slice(-6)} has been deleted.`});
    router.push("/dashboard");
  }

  if (!test) {
    return (
      <div className="flex h-full items-center justify-center">
        {/* You can add a loader here */}
      </div>
    );
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
          <Button variant="outline" asChild disabled>
            <Link href={test.reportUrl || "#"} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this test
                    and remove its data from our servers.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <SieveResultsDisplay
        sieves={test.sieves}
        results={test.results}
        type={test.type}
      />
    </div>
  );
}
