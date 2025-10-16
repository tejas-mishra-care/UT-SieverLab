
"use client";

import { Suspense, useState, useEffect, use } from 'react';
import { notFound, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Pencil } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import React from "react";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, deleteDoc }from "firebase/firestore";
import Link from "next/link";
import { SieveResultsDisplay } from '@/components/sieve-results-display';
import { SieveInputsDisplay } from '@/components/sieve-inputs-display';

function TestView({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  const testDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'tests', id);
  }, [firestore, id]);

  const { data: test, isLoading: isTestLoading } = useDoc<SieveAnalysisTest>(testDocRef);

  useEffect(() => {
    if (!isUserLoading && !isTestLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      if (test && test.userId !== user.uid) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this test.",
        });
        router.push("/dashboard");
      }
    }
  }, [id, firestore, user, isUserLoading, router, toast, test, isTestLoading]);

  useEffect(() => {
    if (!isTestLoading && !test) {
      notFound();
    }
  }, [isTestLoading, test]);

  const handleDelete = async () => {
    if (!test || !firestore || !testDocRef) return;
    setIsDeleting(true);
    try {
      await deleteDoc(testDocRef);
      toast({
        title: "Test Deleted",
        description: `Test "${test.name}" has been deleted.`,
      });
      router.push("/dashboard");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete test. " + e.message,
      });
      setIsDeleting(false);
    }
  };

  if (isTestLoading || isUserLoading || !test) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isDraft = test.status === 'draft';

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-headline text-3xl font-bold">{test.name}</h2>
          <p className="text-muted-foreground">
            {`Test ID: ${test.id.slice(-6)} • Completed on ${new Date(test.timestamp).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/test/${test.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Test
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
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
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="rounded-lg bg-background">
        <div className="space-y-6">
          <div className="space-y-6 rounded-lg bg-background p-6">
            <div className="mb-6 border-b pb-4">
              <h1 className="font-headline text-2xl font-bold">{test.name}</h1>
              <p className="text-sm text-muted-foreground">
                Sieve Analysis Report &bull;{" "}
                {new Date(test.timestamp).toLocaleDateString()}
              </p>
            </div>
            <SieveInputsDisplay sieves={test.sieves} weights={test.weights} />
            <SieveResultsDisplay
              sieves={test.sieves}
              percentPassing={test.percentPassing}
              percentRetained={test.percentRetained}
              cumulativeRetained={test.cumulativeRetained}
              finenessModulus={test.finenessModulus}
              classification={test.classification}
              type={test.type}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestViewPage({ params }: { params: { id: string } }) {
  const resolvedParams = use(params);

  return (
    <Suspense fallback={<div className="flex h-full min-h-[500px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <TestView id={resolvedParams.id} />
    </Suspense>
  );
}
