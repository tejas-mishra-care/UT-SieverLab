
"use client";

import { NewTestForm } from "@/components/new-test-form";
import { useFirestore, useUser, useDoc } from "@/firebase";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { Loader2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { notFound, useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

function EditTestView({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const testDocRef = useMemo(() => {
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
  
  // After loading, if there's no data and no error, it means not found.
  useEffect(() => {
    if (!isTestLoading && !test) {
        notFound();
    }
  }, [isTestLoading, test]);


  if (isTestLoading || isUserLoading || !test) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
  const id = React.use(params).id;
  
  return (
    <React.Suspense fallback={<div className="flex h-full min-h-[500px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <EditTestView id={id} />
    </React.Suspense>
  );
}
