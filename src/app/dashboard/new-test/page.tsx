
"use client";

import { Loader2 } from "lucide-react";

// This page is now a loading placeholder as the layout handles creating a new test
// and redirecting to the edit page.
export default function NewTestPage() {
  return (
    <div className="flex h-full min-h-[500px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">Creating a new test...</p>
      </div>
    </div>
  );
}
