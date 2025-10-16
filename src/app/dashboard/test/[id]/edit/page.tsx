
"use client";

import { Suspense, use } from 'react';
import { notFound } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc }from "firebase/firestore";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { SieveAnalysisCalculator } from "@/components/sieve-analysis-calculator";
import { Loader2 } from 'lucide-react';

function EditTestView({ id }: { id: string }) {
  const firestore = useFirestore();
  
  const testDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'tests', id);
  }, [firestore, id]);

  const { data: test, isLoading: isTestLoading } = useDoc<SieveAnalysisTest>(testDocRef);

  if (isTestLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!test) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-3xl font-bold">Edit Sieve Analysis</h2>
        <p className="text-muted-foreground">
          Modify the values for your test: {test.name}
        </p>
      </div>
      <SieveAnalysisCalculator existingTest={test} />
    </div>
  );
}


export default function EditTestPage({ params }: { params: { id: string } }) {
    const resolvedParams = use(params);
    return (
        <Suspense fallback={<div className="flex h-full min-h-[500px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EditTestView id={resolvedParams.id} />
        </Suspense>
    );
}
