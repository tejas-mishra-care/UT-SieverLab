
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
    
    const svgClone = svgEl.cloneNode(true) as SVGSVGElement;

    // Force application of styles to the cloned SVG
    const originalElements = svgEl.querySelectorAll('path, line, circle, rect, text, .recharts-text, .recharts-legend-item-text');
    const clonedElements = svgClone.querySelectorAll('path, line, circle, rect, text, .recharts-text, .recharts-legend-item-text');

    originalElements.forEach((originalEl, index) => {
        const clonedEl = clonedElements[index];
        if (clonedEl) {
            const computedStyle = window.getComputedStyle(originalEl);
            const styleToApply: Partial<CSSStyleDeclaration> = {
                stroke: computedStyle.stroke,
                strokeWidth: computedStyle.strokeWidth,
                fill: computedStyle.fill,
                strokeDasharray: computedStyle.strokeDasharray,
                opacity: computedStyle.opacity,
                fontFamily: computedStyle.fontFamily,
                fontSize: computedStyle.fontSize,
                fontWeight: computedStyle.fontWeight,
            };
             Object.assign((clonedEl as HTMLElement).style, styleToApply);
        }
    });

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const svgSize = svgEl.getBoundingClientRect();
    const scale = 2.5; 
    canvas.width = svgSize.width * scale;
    canvas.height = svgSize.height * scale;
    
    ctx.fillStyle = 'white'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));

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

  const addSection = async (title: string, results: AnalysisResults, weights: number[], type: ExtendedAggregateType, sieves: number[]) => {
      if ((doc as any).internal.getNumberOfPages() > 1 || yPos > headerHeight + 5) {
          doc.addPage();
          yPos = headerHeight;
      } else if (yPos > headerHeight) {
          yPos += 10;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, pageMargin, yPos);
      yPos += 8;

      const summaryBody = [
          ['Aggregate Type', type],
          [type === 'Fine' ? 'Zone' : 'Classification', results.classification || 'N/A'],
          ['Fineness Modulus', results.finenessModulus?.toFixed(2) || 'N/A']
      ];
      autoTable(doc, {
          body: summaryBody,
          startY: yPos,
          theme: 'plain',
          tableWidth: pageWidth / 3.5,
          styles: { fontSize: 9, cellPadding: 1 },
          columnStyles: { 0: { fontStyle: 'bold' } },
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;


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
            limits ? `${limits.min.toFixed(0)} - ${limits.max.toFixed(0)}` : 'N/A',
            limits ? (isOutOfSpec ? 'Out of Spec' : 'In Spec') : 'N/A'
        ];
      });
      
      autoTable(doc, {
        head: [['Sieve (mm)', 'Wt. Ret (g)', '% Retained', 'Cum. % Retained', '% Passing', 'BIS Limits (%)', 'Remark']],
        body: tableBody,
        startY: yPos,
        theme: 'striped',
        tableWidth: pageWidth,
        headStyles: { fillColor: [41, 128, 185], textColor: 'white', fontSize: 8, cellPadding: 1.5 },
        styles: { fontSize: 8, cellPadding: 1.5 },
        columnStyles: { 
            0: {cellWidth: 'auto'},
            1: {cellWidth: 'auto', halign: 'right'},
            2: {cellWidth: 'auto', halign: 'right'},
            3: {cellWidth: 'auto', halign: 'right'},
            4: {cellWidth: 'auto', halign: 'right', fontStyle: 'bold'},
            5: {cellWidth: 'auto', halign: 'center'},
            6: {cellWidth: 'auto', halign: 'center'},
        },
        didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.dataKey === 6 && hookData.cell.raw === 'Out of Spec') {
                hookData.cell.styles.textColor = [255, 0, 0];
            }
            if (hookData.section === 'body' && type === 'Fine' && sieves[hookData.row.index] === 0.6) {
                hookData.cell.styles.fillColor = '#fef9c3';
            }
        },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
    
    const chartId = `${type.replace(/\s+/g, '-')}-chart`;
    const chartImage = await getChartImage(chartId);
    
    const remainingSpace = pageHeight - yPos - footerHeight - 5;
    const chartHeight = remainingSpace > 60 ? remainingSpace : 60; // Use at least 60mm
    const chartWidth = pageWidth;
    const chartX = pageMargin;

    if (yPos + chartHeight > pageHeight - footerHeight) {
        doc.addPage();
        yPos = headerHeight;
    }
    
    if (chartImage) {
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
    await addSection('Coarse Aggregate (Graded) Results', data.coarseGradedResults, data.coarseGradedWeights, 'Coarse - Graded', SIEVE_SIZES.COARSE_GRADED);
  }
  if (data.coarseSingle20mmResults) {
    await addSection('Coarse Aggregate (20mm) Results', data.coarseSingle20mmResults, data.coarseSingle20mmWeights, 'Coarse - 20mm', SIEVE_SIZES.COARSE_SINGLE_20MM);
  }
  if (data.coarseSingle10mmResults) {
    await addSection('Coarse Aggregate (10mm) Results', data.coarseSingle10mmResults, data.coarseSingle10mmWeights, 'Coarse - 10mm', SIEVE_SIZES.COARSE_SINGLE_10MM);
  }

  if(data.showCombined && data.combinedChartData.length > 0) {
    doc.addPage();
    yPos = headerHeight;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('Combined Gradation', pageMargin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const blendText = `Blend: ${data.fineAggregatePercentage}% Fine, ${data.coarseAggregatePercentage}% Coarse (using ${data.coarseForCombination})`;
    doc.text(blendText, pageMargin, yPos);
    yPos += 10;
    
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

    yPos = (doc as any).lastAutoTable.finalY + 5;
    
    const combinedChartImage = await getChartImage('combined-gradation-chart');
    const remainingSpace = pageHeight - yPos - footerHeight - 5;
    const chartHeight = remainingSpace > 80 ? remainingSpace : 80;
    const chartWidth = pageWidth;

    if (yPos + chartHeight > pageHeight - footerHeight) {
        doc.addPage();
        yPos = headerHeight;
    }

    if (combinedChartImage) {
      doc.addImage(combinedChartImage, 'PNG', pageMargin, yPos, chartWidth, chartHeight);
    }
  }

  addFooter();
  doc.save(`${data.testName || "sieve-analysis"}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
