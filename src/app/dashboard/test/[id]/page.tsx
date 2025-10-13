
"use client";

import { notFound, useRouter } from "next/navigation";
import { SieveResultsDisplay } from "@/components/sieve-results-display";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Loader2 } from "lucide-react";
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
import React from "react";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function TestViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const testDocRef = useMemoFirebase(() => {
      if (!params.id || !firestore) return null;
      return doc(firestore, "tests", params.id);
  }, [firestore, params.id]);

  const { data: test, isLoading } = useDoc<SieveAnalysisTest>(testDocRef);

  const handleDelete = async () => {
    if (!test || !testDocRef) return;
    deleteDocumentNonBlocking(testDocRef);
    toast({title: "Test Deleted", description: `Test #${test.id.slice(-6)} has been deleted.`});
    router.push("/dashboard");
  }

  // Security check after loading
  React.useEffect(() => {
    if (!isLoading && test && user && test.userId !== user.uid) {
      toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this test." });
      router.push("/dashboard");
    }
  }, [isLoading, test, user, router, toast]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!isLoading && !test) {
    notFound();
  }


  if (!test) {
    // This will be caught by the notFound() call above, but it keeps typescript happy
    return null;
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
