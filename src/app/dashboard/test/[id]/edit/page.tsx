
"use client";

import { NewTestForm } from "@/components/new-test-form";
import { useDoc, useFirestore, useUser } from "@/firebase";
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

  const [testDocRef, setTestDocRef] = React.useState<any>(null);

  useEffect(() => {
    // Wait until firestore and id are available to create the doc ref.
    if (firestore && id) {
      setTestDocRef(doc(firestore, "tests", id));
    }
  }, [firestore, id]);

  const { data: test, isLoading: isTestLoading } = useDoc<SieveAnalysisTest>(testDocRef);

  useEffect(() => {
    // This effect handles authorization and not found cases after data loading is complete.
    const isDataLoaded = !isUserLoading && !isTestLoading;
    if (isDataLoaded) {
      if (!test) {
        // If the document doesn't exist after loading, show 404.
        notFound();
        return;
      }
      if (user && test.userId !== user.uid) {
        // If the test doesn't belong to the current user, deny access.
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to edit this test.",
        });
        router.push("/dashboard");
      }
    }
  }, [isUserLoading, isTestLoading, test, user, router, toast]);

  // Combined loading state. Show spinner until all dependencies are ready.
  const isLoading = isUserLoading || isTestLoading || !testDocRef || !test;

  if (isLoading) {
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
          Modify your test details and recalculate the results. Your progress is saved automatically.
        </p>
      </div>
      {/* Pass the fully loaded test object to the form */}
      <NewTestForm existingTest={test} />
    </div>
  );
}


export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditTest id={id} />;
}
