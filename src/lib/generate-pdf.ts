
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { AnalysisResults, ExtendedAggregateType } from "./definitions";
import { getSievesForType, getSpecLimitsForType, SIEVE_SIZES } from "./sieve-analysis";

type CoarseForCombination = 'Graded' | 'Coarse - 20mm' | 'Coarse - 10mm';

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
  coarseForCombination: CoarseForCombination | null;
}

async function getChartImage(chartId: string): Promise<string | null> {
  const reportTab = document.getElementById('pdf-content');
  if (!reportTab) return null;
  
  const chartEl = document.getElementById(chartId);
  if (!chartEl) {
      console.error(`Chart element with ID '${chartId}' not found.`);
      return null;
  }

  const svgEl = chartEl.querySelector("svg");
  if (!svgEl) {
      console.error(`SVG element not found within chart ID '${chartId}'.`);
      return null;
  }
  
  svgEl.querySelectorAll('path').forEach((path) => {
    if (path.classList.contains('recharts-curve') || path.classList.contains('recharts-area-path') || path.classList.contains('recharts-line')) {
      const originalStroke = path.getAttribute('stroke');
      if (!originalStroke || originalStroke === 'none' || originalStroke === 'transparent') {
        path.setAttribute('stroke', '#333');
      }
      if (!path.getAttribute('stroke-width')) {
        path.setAttribute('stroke-width', '1');
      }
    }
  });


  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  
  const svgSize = svgEl.getBoundingClientRect();
  canvas.width = svgSize.width * 2.5; 
  canvas.height = svgSize.height * 2.5;
  
  ctx.fillStyle = 'white'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(svgData)));

  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png", 1.0));
    };
    img.onerror = (e) => {
        console.error("Image loading for PDF chart failed.", e);
        resolve(null);
    }
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerHeight = 15;

  let yPos = 20;

  const addHeader = (title: string) => {
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageMargin, yPos);
    yPos += 8;
  
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${format(new Date(), "PPpp")}`, pageMargin, yPos);
    yPos += 12;
  }
  
  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Page ${i} of ${pageCount}`, 
            pageMargin, 
            pageHeight - footerHeight / 2,
            { align: 'left'}
        );
        doc.text(
            'SieveLab Analysis Report',
            doc.internal.pageSize.getWidth() - pageMargin,
            pageHeight - footerHeight / 2,
            { align: 'right' }
        );
    }
  }

  addHeader(data.testName || "Sieve Analysis Report");

  const addSection = async (title: string, results: AnalysisResults, weights: number[], type: ExtendedAggregateType, sieves: number[]) => {
      if (yPos > 180) { 
          doc.addPage();
          yPos = 20;
      }
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, pageMargin, yPos);
      yPos += 8;

      autoTable(doc, {
          startY: yPos,
          body: [
              [
                  { content: type === 'Fine' ? 'Zone' : 'Classification', styles: { fontStyle: 'bold' } },
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
      
      const specLimits = getSpecLimitsForType(type, results.classification);
      const tableBody = sieves.map((sieve, i) => {
        const limits = specLimits ? specLimits[sieve] : null;
        const isOutOfSpec = limits ? results.percentPassing[i] < limits.min || results.percentPassing[i] > limits.max : false;
        return [
            sieve.toString(), 
            (weights[i] ?? 0).toFixed(2),
            results.percentRetained[i]?.toFixed(2) ?? '0.00', 
            results.cumulativeRetained[i]?.toFixed(2) ?? '0.00', 
            results.percentPassing[i]?.toFixed(2) ?? '0.00',
            limits ? `${limits.min.toFixed(0)} - ${limits.max.toFixed(0)}` : 'N/A',
            limits ? (isOutOfSpec ? 'Out of Spec' : 'In Spec') : 'N/A'
        ];
      });

      autoTable(doc, {
        head: [['Sieve (mm)', 'Wt. Retained (g)', '% Retained', 'Cum. % Retained', '% Passing', 'BIS Limits', 'Remark']],
        body: tableBody,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 'white' },
        columnStyles: { 4: {fontStyle: 'bold'} },
        didParseCell: (hookData) => {
          if (hookData.section === 'body' && hookData.column.index === 6 && hookData.cell.raw === 'Out of Spec') {
            hookData.cell.styles.textColor = [255, 0, 0]; // Red
          }
          if (hookData.section === 'body' && type === 'Fine' && sieves[hookData.row.index] === 0.6) {
             hookData.row.styles.fillColor = '#fef9c3'; // Tailwind yellow-100
          }
        },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    const chartId = `${type.replace(/\s+/g, '-')}-chart`;
    
    if (yPos > pageHeight - 110) {
        doc.addPage();
        yPos = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Grading Curve", pageMargin, yPos);
    yPos += 6;
    
    const chartImage = await getChartImage(chartId);
    if(chartImage) {
        doc.addImage(chartImage, 'PNG', pageMargin, yPos, pageWidth, 80);
        yPos += 90;
    } else {
        doc.setFontSize(10);
        doc.text("Chart could not be rendered.", pageMargin, yPos);
        yPos += 10;
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
    if (yPos > 100) { 
        doc.addPage();
        yPos = 20;
    }
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('Combined Gradation', pageMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const blendText = `Blend: ${data.fineAggregatePercentage}% Fine, ${data.coarseAggregatePercentage}% Coarse (using ${data.coarseForCombination})`;
    doc.text(blendText, pageMargin, yPos);
    yPos += 10;
    
    if (yPos > pageHeight - 110) {
        doc.addPage();
        yPos = 20;
    }
    
    const combinedChartImage = await getChartImage('combined-gradation-chart');
    if(combinedChartImage) {
        doc.addImage(combinedChartImage, 'PNG', pageMargin, yPos, pageWidth, 80);
        yPos += 90;
    }
    
    if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
    }

    const sortedData = [...data.combinedChartData].sort((a, b) => b.sieveSize - a.sieveSize);
    autoTable(doc, {
        head: [['Sieve (mm)', 'Lower Limit (%)', 'Upper Limit (%)', 'Combined Passing (%)', 'Status']],
        body: sortedData.map(row => {
            const isOutOfSpec = row.combinedPassing < row.lowerLimit || row.combinedPassing > row.upperLimit;
            return [
                row.sieveSize.toFixed(2),
                row.lowerLimit.toFixed(2),
                row.upperLimit.toFixed(2),
                row.combinedPassing.toFixed(2),
                isOutOfSpec ? 'Out of Spec' : 'In Spec'
            ]
        }),
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 'white' },
        didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 4) {
                if (hookData.cell.raw === 'Out of Spec') {
                    hookData.cell.styles.textColor = [255, 0, 0];
                    hookData.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });

  }

  addFooter();
  doc.save(`${data.testName || "sieve-analysis"}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

    