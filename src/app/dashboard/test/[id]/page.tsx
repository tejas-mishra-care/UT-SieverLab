
"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
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
} from "@/components/ui/alert-dialog";
import React from "react";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, deleteDoc }from "firebase/firestore";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Link from "next/link";
import { SieveInputsDisplay } from '@/components/sieve-inputs-display';

function TestView({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  const testDocRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'tests', id);
  }, [firestore, id]);

  const { data: test, isLoading: isTestLoading } = useDoc<SieveAnalysisTest>(testDocRef);

  useEffect(() => {
    if (!isUserLoading && !isTestLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      if (test && test.userId !== user.uid) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this test.",
        });
        router.push("/dashboard");
      }
    }
  }, [id, firestore, user, isUserLoading, router, toast, test, isTestLoading]);

  useEffect(() => {
    if (!isTestLoading && !test) {
      notFound();
    }
  }, [isTestLoading, test]);

  const handleDelete = async () => {
    if (!test || !firestore || !testDocRef) return;
    setIsDeleting(true);
    try {
      await deleteDoc(testDocRef);
      toast({
        title: "Test Deleted",
        description: `Test "${test.name}" has been deleted.`,
      });
      router.push("/dashboard");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete test. " + e.message,
      });
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!printRef.current || !test) return;
    setIsDownloading(true);
    try {
      const element = printRef.current;
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = 'white';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      element.style.backgroundColor = originalBg;

      const data = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      const imgProps = pdf.getImageProperties(data);
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let position = 0;
      let heightLeft = imgHeight;
      const pageHeight = pdf.internal.pageSize.getHeight() - 20;

      pdf.addImage(data, "PNG", 10, 10, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(data, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`SieveLab Report - ${test.name}.pdf`);

    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not generate PDF. " + e.message,
      });
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isTestLoading || isUserLoading || !test) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isDraft = test.status === 'draft';

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-headline text-3xl font-bold">{test.name}</h2>
          <p className="text-muted-foreground">
            {isDraft ? 'Draft' : 
            `Test ID: ${test.id.slice(-6)} • Completed on ${new Date(test.timestamp).toLocaleDateString()}`
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/test/${test.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {!isDraft && (
            <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download Report
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
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

      <div className="rounded-lg bg-background">
        {isDraft ? (
             <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                <h3 className="text-xl font-bold tracking-tight">This is a draft.</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Complete the test to see the results.
                </p>
                <Button asChild>
                    <Link href={`/dashboard/test/${test.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Continue Editing
                    </Link>
                </Button>
            </div>
        ) : (
          <div className="space-y-6">
            <div ref={printRef} className="space-y-6 rounded-lg bg-background p-6">
              <div className="mb-6 border-b pb-4">
                <h1 className="font-headline text-2xl font-bold">{test.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Sieve Analysis Report &bull;{" "}
                  {new Date(test.timestamp).toLocaleDateString()}
                </p>
              </div>
              <SieveInputsDisplay sieves={test.sieves} weights={test.weights} />
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
        )}
      </div>
    </div>
  );
}

export default function TestViewPage({ params }: { params: { id: string } }) {
  const id = React.use(params).id;

  return (
    <Suspense fallback={<div className="flex h-full min-h-[500px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <TestView id={id} />
    </Suspense>
  );
}

    