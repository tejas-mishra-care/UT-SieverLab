
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { Beaker, Calendar, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";

type TestCardProps = {
  test: SieveAnalysisTest;
};

export function TestCard({ test }: TestCardProps) {
  return (
    <Link href={`/dashboard/test/${test.id}`} className="block">
      <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-0.5">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-headline text-lg truncate" title={test.name}>
              {test.name}
            </CardTitle>
            <Badge variant={test.type === "Fine" ? "secondary" : "default"} className="capitalize flex-shrink-0">
              {test.type}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-2 pt-2 text-xs">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(test.timestamp), "PPP")}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Beaker className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">
              {test.results.classification || "N/A"}
            </span>
          </div>
          {test.results.finenessModulus != null && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span>
                Fineness Modulus:{" "}
                <span className="font-bold text-foreground">
                  {test.results.finenessModulus.toFixed(2)}
                </span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
