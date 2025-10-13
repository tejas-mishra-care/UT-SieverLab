
"use client";

import { NewTestForm } from "@/components/new-test-form";
import { useFirestore, useUser } from "@/firebase";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { notFound, useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import { useToast } from "@/hooks/use-toast";

// The page component now correctly unwraps the params promise.
function EditTestView({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [test, setTest] = useState<SieveAnalysisTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !firestore) return;

    if (!user) {
      router.push("/");
      return;
    }

    const fetchTest = async () => {
      const testDocRef = doc(firestore, "tests", id);
      const testSnap = await getDoc(testDocRef);

      if (!testSnap.exists()) {
        notFound();
        return;
      }
      
      const testData = testSnap.data() as SieveAnalysisTest;

      if (testData.userId !== user?.uid) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to edit this test.",
        });
        router.push("/dashboard");
        return;
      }

      setTest(testData);
      setIsLoading(false);
    };

    fetchTest();
  }, [firestore, isUserLoading, user, id, router, toast]);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!test) {
    // This case is hit if loading is done but test is still null (e.g., not found).
    // The notFound() inside fetchTest should handle this, but this is a safeguard.
    return null;
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


// This is the main page component. It is now a server component
// that uses Suspense to handle the loading state.
export default function EditTestPage({ params }: { params: { id: string } }) {
  // `params` are guaranteed to be available in pages.
  return (
    <React.Suspense fallback={<div className="flex h-full min-h-[500px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <EditTestView id={params.id} />
    </React.Suspense>
  );
}
