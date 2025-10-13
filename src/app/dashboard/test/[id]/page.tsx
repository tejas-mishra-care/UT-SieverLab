
"use client";

import { notFound, useRouter } from "next/navigation";
import { SieveResultsDisplay } from "@/components/sieve-results-display";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Loader2, Pencil } from "lucide-react";
import type { SieveAnalysisTest } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import React, { use } from "react";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Link from "next/link";

export default function TestViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const printRef = React.useRef<HTMLDivElement>(null);

  const testDocRef = useMemoFirebase(() => {
      // Wait for both ID and Firestore to be available before creating the reference.
      if (!id || !firestore) return null; 
      return doc(firestore, "tests", id);
  }, [firestore, id]);

  const { data: test, isLoading: isTestLoading } = useDoc<SieveAnalysisTest>(testDocRef);

  const handleDelete = async () => {
    if (!test || !testDocRef) return;
    setIsDeleting(true);
    try {
        await deleteDoc(testDocRef);
        toast({title: "Test Deleted", description: `Test "${test.name}" has been deleted.`});
        router.push("/dashboard");
    } catch(e: any) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete test. " + e.message });
        setIsDeleting(false);
    }
  }

  const handleDownload = async () => {
    if (!printRef.current || !test) return;
    setIsDownloading(true);
    try {
        const element = printRef.current;
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
        });
        const data = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        
        let newImgWidth = pdfWidth - 20; // with 10mm margin
        let newImgHeight = newImgWidth / ratio;

        if (newImgHeight > pdfHeight - 20) {
            newImgHeight = pdfHeight - 20;
            newImgWidth = newImgHeight * ratio;
        }

        const x = (pdfWidth - newImgWidth) / 2;
        const y = 10; // 10mm top margin

        pdf.addImage(data, 'PNG', x, y, newImgWidth, newImgHeight);
        pdf.save(`SieveLab Report - ${test.name}.pdf`);
    } catch (e) {
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: "Could not generate PDF. Please try again."
        });
        console.error(e);
    } finally {
        setIsDownloading(false);
    }
  };


  React.useEffect(() => {
    const isDataLoaded = !isUserLoading && !isTestLoading;
    if (isDataLoaded && test && user && test.userId !== user.uid) {
      toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this test." });
      router.push("/dashboard");
    }
  }, [isUserLoading, isTestLoading, test, user, router, toast]);

  const isLoading = isUserLoading || isTestLoading;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // After loading, if the test is still not found (and the ref was valid), then show 404.
  if (!isLoading && !test) {
    notFound();
  }


  if (!test) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-headline text-3xl font-bold">
            {test.name}
          </h2>
          <p className="text-muted-foreground">
            Test ID: {test.id.slice(-6)} &bull; Completed on {new Date(test.timestamp).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/test/${test.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download Report
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this test
                    and remove its data from our servers.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div ref={printRef} className="bg-background rounded-lg p-4">
        <SieveResultsDisplay
            sieves={test.sieves}
            percentPassing={test.percentPassing}
            percentRetained={test.percentRetained}
            cumulativeRetained={test.cumulativeRetained}
            finenessModulus={test.finenessModulus}
            classification={test.classification}
            type={test.type}
        />
      </div>
    </div>
  );
}
