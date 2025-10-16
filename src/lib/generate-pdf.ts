import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { AnalysisResults } from "./definitions";
import { SIEVE_SIZES } from "./sieve-analysis";

interface PdfData {
  testName: string;
  fineResults: AnalysisResults | null;
  coarseResults: AnalysisResults | null;
  fineWeights: number[];
  coarseWeights: number[];
  combinedChartData: any[];
  fineAggregatePercentage: number;
  coarseAggregatePercentage: number;
  showCombined: boolean;
}

// Function to convert a Recharts chart to a data URL
async function getChartDataURL(chartId: string): Promise<string | null> {
  const chartContainer = document.getElementById(chartId);
  const svgElement = chartContainer?.querySelector("svg");

  if (!svgElement) {
    console.error(`SVG element for chartId "${chartId}" not found.`);
    return null;
  }

  // Create a new SVG element with a white background
  const newSvg = svgElement.cloneNode(true) as SVGSVGElement;
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("width", "100%");
  rect.setAttribute("height", "100%");
  rect.setAttribute("fill", "white");
  newSvg.insertBefore(rect, newSvg.firstChild);

  const svgString = new XMLSerializer().serializeToString(newSvg);
  const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));

  return dataUrl;
}


export async function generatePdf(data: PdfData) {
  const {
    testName,
    fineResults,
    coarseResults,
    fineWeights,
    coarseWeights,
    combinedChartData,
    fineAggregatePercentage,
    coarseAggregatePercentage,
    showCombined,
  } = data;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let cursorY = margin;

  // --- Title and Header ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(testName || "Sieve Analysis Report", pageWidth / 2, cursorY, { align: "center" });
  cursorY += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${format(new Date(), "PPP, p")}`, pageWidth / 2, cursorY, { align: "center" });
  cursorY += 15;

  const addPageBreakIfNeeded = (requiredHeight: number) => {
    if (cursorY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  // --- Fine Aggregate Section ---
  if (fineResults) {
    addPageBreakIfNeeded(60); // Approx height for section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Fine Aggregate Results", margin, cursorY);
    cursorY += 8;

    // Summary Cards
    const summaryData = [
        ["Classification", fineResults.classification || 'N/A'],
        ["Fineness Modulus", fineResults.finenessModulus?.toFixed(2) || 'N/A']
    ];
    autoTable(doc, {
        body: summaryData,
        startY: cursorY,
        theme: 'grid',
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold' } },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 10;
    
    // Input and Results Tables
    const inputBody = SIEVE_SIZES.FINE.map((sieve, i) => [sieve, (fineWeights[i] || 0).toFixed(2)]);
    inputBody.push(['Pan', (fineWeights[SIEVE_SIZES.FINE.length] || 0).toFixed(2)]);
    
    const resultsBody = SIEVE_SIZES.FINE.map((sieve, i) => [
        sieve,
        fineResults.percentRetained[i].toFixed(2),
        fineResults.cumulativeRetained[i].toFixed(2),
        fineResults.percentPassing[i].toFixed(2)
    ]);
    
    autoTable(doc, {
        head: [['Sieve (mm)', 'Wt. Retained (g)']],
        body: inputBody,
        startY: cursorY,
        theme: 'grid',
        styles: { fontSize: 8 },
        margin: { right: pageWidth / 2 + 5 }
    });

    autoTable(doc, {
        head: [['Sieve (mm)', '% Retained', 'Cum. % Retained', '% Passing']],
        body: resultsBody,
        startY: cursorY,
        theme: 'grid',
        styles: { fontSize: 8 },
        margin: { left: pageWidth / 2 - 5 }
    });

    cursorY = (doc as any).lastAutoTable.finalY + 10;

    addPageBreakIfNeeded(80);
    // Chart
    const fineChartDataUrl = await getChartDataURL("fine-aggregate-chart");
    if (fineChartDataUrl) {
      doc.addImage(fineChartDataUrl, 'JPEG', margin, cursorY, pageWidth - (margin * 2), 70);
      cursorY += 80;
    }
  }

  // --- Coarse Aggregate Section ---
  if (coarseResults) {
    addPageBreakIfNeeded(60);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Coarse Aggregate Results", margin, cursorY);
    cursorY += 8;

    const summaryData = [["Classification", coarseResults.classification || 'N/A']];
    autoTable(doc, {
        body: summaryData,
        startY: cursorY,
        theme: 'grid',
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold' } },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 10;
    
    // Tables
    const inputBody = SIEVE_SIZES.COARSE.map((sieve, i) => [sieve, (coarseWeights[i] || 0).toFixed(2)]);
    inputBody.push(['Pan', (coarseWeights[SIEVE_SIZES.COARSE.length] || 0).toFixed(2)]);

    const resultsBody = SIEVE_SIZES.COARSE.map((sieve, i) => [
        sieve,
        coarseResults.percentRetained[i].toFixed(2),
        coarseResults.cumulativeRetained[i].toFixed(2),
        coarseResults.percentPassing[i].toFixed(2)
    ]);

    autoTable(doc, {
        head: [['Sieve (mm)', 'Wt. Retained (g)']],
        body: inputBody,
        startY: cursorY,
        theme: 'grid',
        styles: { fontSize: 8 },
        margin: { right: pageWidth / 2 + 5 }
    });

    autoTable(doc, {
        head: [['Sieve (mm)', '% Retained', 'Cum. % Retained', '% Passing']],
        body: resultsBody,
        startY: cursorY,
        theme: 'grid',
        styles: { fontSize: 8 },
        margin: { left: pageWidth / 2 - 5 }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 10;

    addPageBreakIfNeeded(80);
    // Chart
    const coarseChartDataUrl = await getChartDataURL("coarse-aggregate-chart");
    if (coarseChartDataUrl) {
      doc.addImage(coarseChartDataUrl, 'JPEG', margin, cursorY, pageWidth - (margin * 2), 70);
      cursorY += 80;
    }
  }
  
  // --- Combined Gradation Section ---
  if (showCombined) {
    addPageBreakIfNeeded(100);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Combined Gradation", margin, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    doc.text(`Blend: ${fineAggregatePercentage}% Fine Aggregate, ${coarseAggregatePercentage}% Coarse Aggregate`, margin, cursorY);
    cursorY += 10;

    const combinedChartDataUrl = await getChartDataURL("combined-gradation-chart");
    if (combinedChartDataUrl) {
      doc.addImage(combinedChartDataUrl, 'JPEG', margin, cursorY, pageWidth - (margin*2), 100);
      cursorY += 110;
    }
  }


  doc.save(`${testName || "sieve-analysis"}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
