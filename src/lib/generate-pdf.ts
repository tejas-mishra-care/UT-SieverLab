
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { AnalysisResults, ExtendedAggregateType } from "./definitions";
import { SIEVE_SIZES } from "./sieve-analysis";

interface PdfData {
  testName: string;
  fineResults: AnalysisResults | null;
  coarseGradedResults: AnalysisResults | null;
  coarseSingle10mmResults: AnalysisResults | null;
  coarseSingle20mmResults: AnalysisResults | null;
  fineWeights: number[];
  coarseGradedWeights: number[];
  coarseSingle10mmWeights: number[];
  coarseSingle20mmWeights: number[];
  combinedChartData: any[];
  fineAggregatePercentage: number;
  coarseAggregatePercentage: number;
  showCombined: boolean;
}

async function getChartImage(chartId: string): Promise<string | null> {
  const chartEl = document.getElementById(chartId);
  if (!chartEl) return null;

  const svgEl = chartEl.querySelector("svg");
  if (!svgEl) return null;

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  
  const svgSize = svgEl.getBoundingClientRect();
  canvas.width = svgSize.width * 2; // Render at higher resolution
  canvas.height = svgSize.height * 2;

  const img = new Image();
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));

  return new Promise((resolve) => {
    img.onload = () => {
      ctx.fillStyle = 'white'; // Set background to white
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
  });
}

export async function generatePdf(data: PdfData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageMargin = 15;
  const pageWidth = doc.internal.pageSize.getWidth() - pageMargin * 2;

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.testName || "Sieve Analysis Report", pageMargin, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${format(new Date(), "PPpp")}`, pageMargin, 28);
  
  let yPos = 40;

  const addSection = async (title: string, results: AnalysisResults, weights: number[], type: ExtendedAggregateType, sieves: number[]) => {
      if (yPos > 240) { // Check if new page is needed
          doc.addPage();
          yPos = 20;
      }
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, pageMargin, yPos);
      yPos += 8;

      // Summary Cards
      autoTable(doc, {
          startY: yPos,
          body: [
              [
                  { content: 'Classification', styles: { fontStyle: 'bold' } },
                  results.classification || 'N/A',
                  { content: 'Fineness Modulus', styles: { fontStyle: 'bold' } },
                  results.finenessModulus?.toFixed(2) || 'N/A'
              ]
          ],
          theme: 'grid',
          styles: { cellPadding: 2, fontSize: 10 },
          columnStyles: { 0: { cellWidth: 40 }, 2: {cellWidth: 40}}
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Input Weights Table
      autoTable(doc, {
          head: [['Sieve (mm)', 'Wt. Retained (g)']],
          body: [...sieves.map((sieve, i) => [sieve, weights[i]?.toFixed(2) ?? '0.00']), ['Pan', weights[sieves.length]?.toFixed(2) ?? '0.00']],
          startY: yPos,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185], textColor: 'white' }
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;

      // Results Table
      autoTable(doc, {
        head: [['Sieve (mm)', '% Retained', 'Cum. % Retained', '% Passing']],
        body: sieves.map((sieve, i) => [
            sieve, 
            results.percentRetained[i].toFixed(2), 
            results.cumulativeRetained[i].toFixed(2), 
            results.percentPassing[i].toFixed(2)
        ]),
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 'white' },
        columnStyles: { 3: {fontStyle: 'bold'} }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Chart
    const chartId = `${type.replace(/\s/g, '-')}-chart`;
    const chartImage = await getChartImage(chartId);
    if(chartImage) {
        if(yPos > 180) { // Check space for chart
            doc.addPage();
            yPos = 20;
        }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Grading Curve", pageMargin, yPos);
        yPos += 6;
        doc.addImage(chartImage, 'PNG', pageMargin, yPos, pageWidth, 80);
        yPos += 90;
    }
  }

  if (data.fineResults) {
    await addSection('Fine Aggregate Results', data.fineResults, data.fineWeights, 'Fine', SIEVE_SIZES.FINE);
  }
  if (data.coarseGradedResults) {
    await addSection('Coarse Aggregate (Graded) Results', data.coarseGradedResults, data.coarseGradedWeights, 'Coarse - Graded', SIEVE_SIZES.COARSE_GRADED);
  }
  if (data.coarseSingle20mmResults) {
    await addSection('Coarse Aggregate (20mm) Results', data.coarseSingle20mmResults, data.coarseSingle20mmWeights, 'Coarse - 20mm', SIEVE_SIZES.COARSE_SINGLE_20MM);
  }
  if (data.coarseSingle10mmResults) {
    await addSection('Coarse Aggregate (10mm) Results', data.coarseSingle10mmResults, data.coarseSingle10mmWeights, 'Coarse - 10mm', SIEVE_SIZES.COARSE_SINGLE_10MM);
  }

  if(data.showCombined && data.combinedChartData.length > 0) {
    if (yPos > 180) {
        doc.addPage();
        yPos = 20;
    }
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('Combined Gradation', pageMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Blend: ${data.fineAggregatePercentage}% Fine Aggregate, ${data.coarseAggregatePercentage}% Coarse Aggregate`, pageMargin, yPos);
    yPos += 10;
    
    const combinedChartImage = await getChartImage('combined-gradation-chart');
    if(combinedChartImage) {
        doc.addImage(combinedChartImage, 'PNG', pageMargin, yPos, pageWidth, 100);
        yPos += 110;
    }
  }


  doc.save(`${data.testName || "sieve-analysis"}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
