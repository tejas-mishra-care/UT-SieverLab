
"use client";

import { NewTestForm } from "@/components/new-test-form";
import { useFirestore, useUser } from "@/firebase";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { notFound, useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

function EditTest({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [test, setTest] = useState<SieveAnalysisTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect handles authorization after data loading is complete.
    // It runs only when the loading states or data changes.
    if (!firestore || isUserLoading) {
      return; // Wait until firebase is ready and user auth state is known
    }

    const fetchTest = async () => {
      setIsLoading(true);
      const testDocRef = doc(firestore, "tests", id);
      const testSnap = await getDoc(testDocRef);

      if (!testSnap.exists()) {
        notFound();
        return;
      }
      
      const testData = testSnap.data() as SieveAnalysisTest;

      if (testData.userId !== user?.uid) {
        // If the test doesn't belong to the current user, deny access.
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

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!test) {
    // This will be caught by the notFound in the effect, but as a safeguard:
    return notFound();
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
