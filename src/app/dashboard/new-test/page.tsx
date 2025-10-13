
"use client";

import { NewTestForm } from "@/components/new-test-form";

export default function NewTestPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="font-headline text-3xl font-bold">New Sieve Analysis</h2>
        <p className="text-muted-foreground">
          Fill in your test details, enter the weights, and calculate the results.
        </p>
      </div>
      <NewTestForm />
    </div>
  );
}
