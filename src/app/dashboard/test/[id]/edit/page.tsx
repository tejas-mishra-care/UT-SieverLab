
"use client";

import { NewTestForm } from "@/components/new-test-form";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { Loader2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { notFound, useRouter } from "next/navigation";
import React from "react";
import { useToast } from "@/hooks/use-toast";


function EditTest({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const testDocRef = useMemoFirebase(() => {
    if (!id || !firestore) return null;
    return doc(firestore, "tests", id);
  }, [firestore, id]);

  const { data: test, isLoading: isTestLoading } = useDoc<SieveAnalysisTest>(testDocRef);

  React.useEffect(() => {
    const isDataLoaded = !isUserLoading && !isTestLoading;
     if (isDataLoaded && test === null) {
      notFound();
    }
    if (isDataLoaded && test && user && test.userId !== user.uid) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to edit this test.",
      });
      router.push("/dashboard");
    }
  }, [isUserLoading, isTestLoading, test, user, router, toast]);

  const isLoading = isUserLoading || isTestLoading;

  if (isLoading || !test) {
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
      {test && <NewTestForm existingTest={test} />}
    </div>
  );
}


export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <EditTest id={id} />;
}
