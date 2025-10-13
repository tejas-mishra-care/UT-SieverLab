
"use client";

import { NewTestForm } from "@/components/new-test-form";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { Loader2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { notFound, useRouter } from "next/navigation";
import React, { use, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function EditTest({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const testDocRef = useMemoFirebase(() => {
    if (firestore && id) {
      return doc(firestore, "tests", id);
    }
    return null;
  }, [firestore, id]);

  const { data: test, isLoading: isTestLoading } = useDoc<SieveAnalysisTest>(testDocRef);

  useEffect(() => {
    // This effect handles authorization after data loading is complete.
    // It runs only when the loading states or data changes.
    if (!isTestLoading && !isUserLoading && user && test) {
      if (test.userId !== user.uid) {
        // If the test doesn't belong to the current user, deny access.
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to edit this test.",
        });
        router.push("/dashboard");
      }
    }
  }, [isTestLoading, isUserLoading, test, user, router, toast]);

  // Combined loading state. Show spinner until all initial data fetching is attempted.
  const isLoading = isUserLoading || isTestLoading || !testDocRef;
  
  // After loading, if the test is still not found, then it's a 404.
  // This prevents the race condition where we check for `test` before `useDoc` has had a chance to fetch it.
  if (!isLoading && !test) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // We can only reach this point if isLoading is false and test is not null.
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="font-headline text-3xl font-bold">Edit Sieve Analysis</h2>
        <p className="text-muted-foreground">
          Modify your test details and recalculate the results. Your progress is saved automatically.
        </p>
      </div>
      {/* Pass the fully loaded test object to the form */}
      <NewTestForm existingTest={test!} />
    </div>
  );
}


export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditTest id={id} />;
}
