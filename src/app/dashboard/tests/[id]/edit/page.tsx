
"use client";

import { NewTestForm } from "@/components/new-test-form";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { Loader2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { notFound, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function EditTestView({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const testDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "tests", id);
  }, [firestore, id]);

  const { data: test, isLoading: isTestLoading, error } = useDoc<SieveAnalysisTest>(testDocRef);

  useEffect(() => {
    if (!isUserLoading && !isTestLoading && user && test) {
      if (test.userId !== user.uid) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to edit this test.",
        });
        router.push("/dashboard");
      }
    }
  }, [user, test, isUserLoading, isTestLoading, router, toast]);
  
  useEffect(() => {
    if (!isTestLoading && !test && !error) {
        notFound();
    }
  }, [isTestLoading, test, error]);


  if (isTestLoading || isUserLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if(!test) {
     return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <p>Test not found or you do not have permission to view it.</p>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="font-headline text-3xl font-bold">Edit Sieve Analysis</h2>
        <p className="text-muted-foreground">
          Modify your test details and recalculate the results.
        </p>
      </div>
      <NewTestForm existingTest={test} />
    </div>
  );
}


export default function EditTestPage({ params }: { params: { id: string } }) {
  const resolvedParams = React.use(params);
  
  return (
    <React.Suspense fallback={<div className="flex h-full min-h-[500px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <EditTestView id={resolvedParams.id} />
    </React.Suspense>
  );
}
