
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { Beaker, Calendar, Edit, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";

type TestCardProps = {
  test: SieveAnalysisTest;
};

export function TestCard({ test }: TestCardProps) {
  // Always link to the view page. Editing is done from the view page.
  const linkHref = `/dashboard/tests/${test.id}`;

  return (
    <Link href={linkHref} className="block">
      <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-0.5">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-headline text-lg truncate" title={test.name}>
              {test.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              {test.status === 'draft' && <Badge variant="destructive">Draft</Badge>}
              <Badge variant={test.type === "Fine" ? "secondary" : "default"} className="capitalize flex-shrink-0">
                {test.type}
              </Badge>
            </div>
          </div>
          <CardDescription className="flex items-center gap-2 pt-2 text-xs">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(test.timestamp), "PPP")}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {test.status === 'draft' ? (
            <div className="flex items-center gap-3 text-muted-foreground">
                <Edit className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                    Continue editing this draft.
                </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Beaker className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                  {test.classification || "N/A"}
                </span>
              </div>
              {test.finenessModulus != null && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <span>
                    Fineness Modulus:{" "}
                    <span className="font-bold text-foreground">
                      {test.finenessModulus.toFixed(2)}
                    </span>
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
