
"use client";

import { NewTestForm } from "@/components/new-test-form";
import { useDoc, useFirestore, useUser } from "@/firebase";
import { useMemoFirebase } from "@/firebase/provider";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { Loader2 } from "lucide-react";
import { doc } from "firebase/firestore";
import { notFound, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EditTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const testDocRef = useMemoFirebase(() => {
    if (!params.id || !firestore) return null;
    return doc(firestore, "tests", params.id);
  }, [firestore, params.id]);

  const { data: test, isLoading } = useDoc<SieveAnalysisTest>(testDocRef);

  useEffect(() => {
    if (!isLoading && test && user && test.userId !== user.uid) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to edit this test.",
      });
      router.push("/dashboard");
    }
  }, [isLoading, test, user, router, toast]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isLoading && !test) {
    notFound();
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
