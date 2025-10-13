"use client";

import { notFound, useRouter } from "next/navigation";
import { SieveResultsDisplay } from "@/components/sieve-results-display";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc, deleteDoc } from "firebase/firestore";
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

export default function TestViewPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const testRef = useMemoFirebase(() => {
    if (!params.id) return null;
    return doc(firestore, "tests", params.id);
  }, [firestore, params.id]);

  const { data: test, isLoading } = useDoc<SieveAnalysisTest>(testRef);

  const handleDelete = async () => {
    if (!test || !user || user.uid !== test.userId) {
        toast({variant: "destructive", title: "Error", description: "You don't have permission to delete this test."})
        return;
    };
    try {
        await deleteDoc(doc(firestore, "tests", test.id));
        toast({title: "Test Deleted", description: `Test #${test.id.slice(-6)} has been deleted.`});
        router.push("/dashboard");
    } catch(error: any) {
        toast({variant: "destructive", title: "Error deleting test", description: error.message})
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!test) {
    notFound();
  }
  
  if (user && test.userId !== user.uid) {
    // Or a more specific "access denied" page
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
