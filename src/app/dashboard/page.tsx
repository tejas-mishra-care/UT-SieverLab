import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { TestCard } from "@/components/test-card";
import { mockTests } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-headline text-2xl font-bold">Recent Tests</h2>
          <p className="text-muted-foreground">
            Here are the latest sieve analysis tests you have saved.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new-test">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Test
          </Link>
        </Button>
      </div>

      {mockTests.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockTests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <h3 className="text-xl font-bold tracking-tight">No tests found</h3>
            <p className="text-sm text-muted-foreground mb-4">You have not created any tests yet.</p>
             <Button asChild>
                <Link href="/dashboard/new-test">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Test
                </Link>
            </Button>
        </div>
      )}
    </div>
  );
}
