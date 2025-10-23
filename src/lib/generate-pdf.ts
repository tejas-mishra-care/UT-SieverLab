
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
    const classList = path.getAttribute('class') || '';
    if (classList.includes('recharts-curve') || classList.includes('recharts-area-path') || classList.includes('recharts-line-path') || classList.includes('recharts-line')) {
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
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageMargin = 15;
  const pageWidth = doc.internal.pageSize.getWidth() - pageMargin * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  const headerHeight = 20;
  const footerHeight = 15;
  
  let yPos = headerHeight;

  const addPageHeader = (pageNumber: number, totalPages: number) => {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(data.testName || "Sieve Analysis Report", pageMargin, 12);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      doc.internal.pageSize.getWidth() - pageMargin,
      12,
      { align: 'right' }
    );
    doc.setDrawColor(180);
    doc.line(pageMargin, 15, doc.internal.pageSize.getWidth() - pageMargin, 15);
  };
  
  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addPageHeader(i, pageCount); 
        doc.setFontSize(8);
        doc.text(
            `Generated on: ${format(new Date(), "PPpp")}`, 
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

  const startNewPage = () => {
    doc.addPage();
    yPos = headerHeight;
  };

  const addSection = async (title: string, results: AnalysisResults, weights: number[], type: ExtendedAggregateType, sieves: number[]) => {
      const neededHeight = 160; 
      if (yPos + neededHeight > pageHeight - footerHeight && yPos > headerHeight) {
        startNewPage();
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, pageMargin, yPos);
      yPos += 8;

      const specLimits = getSpecLimitsForType(type, results.classification);
      const tableBody = sieves.map((sieve, i) => {
        const limits = specLimits ? specLimits[sieve] : null;
        const isOutOfSpec = limits ? results.percentPassing[i] < limits.min || results.percentPassing[i] > limits.max : false;
        return [
            sieve.toString(), 
            (weights?.[i] ?? 0).toFixed(1),
            results.percentRetained[i]?.toFixed(2) ?? '0.00', 
            results.cumulativeRetained[i]?.toFixed(2) ?? '0.00', 
            results.percentPassing[i]?.toFixed(2) ?? '0.00',
            limits ? limits.min.toFixed(0) : 'N/A',
            limits ? limits.max.toFixed(0) : 'N/A',
            limits ? `${limits.min.toFixed(0)} - ${limits.max.toFixed(0)}` : 'N/A',
            limits ? (isOutOfSpec ? 'Out of Spec' : 'In Spec') : 'N/A'
        ];
      });
      
      autoTable(doc, {
        head: [['Sieve (mm)', 'Wt. Ret (g)', '% Retained', 'Cum. % Retained', '% Passing', 'Lower Limit', 'Upper Limit', 'BIS Limits', 'Remark']],
        body: tableBody,
        startY: yPos,
        theme: 'striped',
        tableWidth: pageWidth,
        headStyles: { fillColor: [41, 128, 185], textColor: 'white', fontSize: 8, cellPadding: 1.5 },
        styles: { fontSize: 8, cellPadding: 1.5 },
        columnStyles: { 
            0: {cellWidth: 18},
            1: {cellWidth: 18, halign: 'right'},
            2: {cellWidth: 22, halign: 'right'},
            3: {cellWidth: 28, halign: 'right'},
            4: {cellWidth: 22, halign: 'right', fontStyle: 'bold'},
            5: {cellWidth: 20, halign: 'center'},
            6: {cellWidth: 20, halign: 'center'},
            7: {cellWidth: 22, halign: 'center'},
            8: {cellWidth: 22, halign: 'center'},
        },
        didParseCell: (hookData) => {
          if (hookData.section === 'body' && hookData.column.index === 8 && hookData.cell.raw === 'Out of Spec') {
            hookData.cell.styles.textColor = [255, 0, 0];
          }
          if (hookData.section === 'body' && type === 'Fine' && sieves[hookData.row.index] === 0.6) {
            if (!hookData.row.styles) {
              hookData.row.styles = {};
            }
            (hookData.row.styles as any).fillColor = '#fef9c3';
          }
        },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
    
    const chartId = `${type.replace(/\s+/g, '-')}-chart`;
    const chartImage = await getChartImage(chartId);
    
    const chartWidth = pageWidth * 0.8;
    const remainingSpace = pageHeight - yPos - footerHeight - 5;
    const chartHeight = remainingSpace > 80 ? remainingSpace : 80;
    const chartX = pageMargin + (pageWidth - chartWidth) / 2;
    
    if (chartImage) {
        if (yPos + chartHeight > pageHeight - footerHeight) {
          startNewPage();
          yPos = headerHeight;
        }
        doc.addImage(chartImage, 'PNG', chartX, yPos, chartWidth, chartHeight);
        yPos += chartHeight;
    } else {
        doc.setFontSize(10);
        doc.text("Chart could not be rendered.", chartX, yPos + 10);
        yPos += 20;
    }
  }

  // Generate a section for each available result set
  if (data.fineResults) {
    await addSection('Fine Aggregate Results', data.fineResults, data.fineWeights, 'Fine', SIEVE_SIZES.FINE);
  }
  if (data.coarseGradedResults) {
    if(data.fineResults) startNewPage();
    await addSection('Coarse Aggregate (Graded) Results', data.coarseGradedResults, data.coarseGradedWeights, 'Coarse - Graded', SIEVE_SIZES.COARSE_GRADED);
  }
  if (data.coarseSingle20mmResults) {
    if(data.fineResults || data.coarseGradedResults) startNewPage();
    await addSection('Coarse Aggregate (20mm) Results', data.coarseSingle20mmResults, data.coarseSingle20mmWeights, 'Coarse - 20mm', SIEVE_SIZES.COARSE_SINGLE_20MM);
  }
  if (data.coarseSingle10mmResults) {
    if(data.fineResults || data.coarseGradedResults || data.coarseSingle20mmResults) startNewPage();
    await addSection('Coarse Aggregate (10mm) Results', data.coarseSingle10mmResults, data.coarseSingle10mmWeights, 'Coarse - 10mm', SIEVE_SIZES.COARSE_SINGLE_10MM);
  }

  if(data.showCombined && data.combinedChartData.length > 0) {
    startNewPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('Combined Gradation', pageMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const blendText = `Blend: ${data.fineAggregatePercentage}% Fine, ${data.coarseAggregatePercentage}% Coarse (using ${data.coarseForCombination})`;
    doc.text(blendText, pageMargin, yPos);
    yPos += 10;
    
    const combinedChartImage = await getChartImage('combined-gradation-chart');
    const chartWidth = pageWidth * 0.7;
    let chartHeight = (pageHeight - yPos - footerHeight - 5) / 2;
    if (chartHeight < 60) chartHeight = 60;
    
    const chartX = pageMargin + (pageWidth - chartWidth) / 2;
    if(combinedChartImage) {
        doc.addImage(combinedChartImage, 'PNG', chartX, yPos, chartWidth, chartHeight);
    }
    yPos += chartHeight + 5;

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
        tableWidth: pageWidth,
        headStyles: { fillColor: [41, 128, 185], textColor: 'white' },
        didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 4) {
                if (hookData.cell.raw === 'Out of Spec') {
                    hookData.cell.styles.textColor = [255, 0, 0];
                    hookData.cell.styles.fontStyle = 'bold';
                }
            }
        },
    });
  }

  addFooter();
  doc.save(`${data.testName || "sieve-analysis"}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
