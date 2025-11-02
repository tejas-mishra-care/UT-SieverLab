
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { AnalysisResults, ExtendedAggregateType, FineAggregateType } from "./definitions";
import { getSievesForType, getSpecLimitsForType, SIEVE_SIZES } from "./sieve-analysis";

type BlendSelection = {
    fine: { type: 'Fine', fineAggType: FineAggregateType, results: AnalysisResults }[];
    coarse: { type: ExtendedAggregateType, results: AnalysisResults }[];
}

interface PdfData {
  testName: string;
  fineNaturalSandResults: AnalysisResults | null;
  fineCrushedSandResults: AnalysisResults | null;
  coarseGradedResults: AnalysisResults | null;
  coarseSingle10mmResults: AnalysisResults | null;
  coarseSingle20mmResults: AnalysisResults | null;
  fineNaturalSandWeights: number[];
  fineCrushedSandWeights: number[];
  coarseGradedWeights: number[];
  coarseSingle10mmWeights: number[];
  coarseSingle20mmWeights: number[];
  combinedChartData: any[];
  blendSelection: BlendSelection;
  blendPercentages: Record<string, number>;
  showCombined: boolean;
}

// Function to fetch an image and convert it to a Base64 data URI
async function getImageAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(`Failed to fetch image from ${url}:`, error);
        return null;
    }
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
    const scale = 1.2; 
    canvas.width = svgSize.width * scale;
    canvas.height = svgSize.height * scale;
    
    ctx.fillStyle = 'white'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));

    return new Promise((resolve) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.9)); 
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

  const [utLogoBase64, abgLogoBase64] = await Promise.all([
    getImageAsBase64('/UT.jpeg?v=2'),
    getImageAsBase64('/ABG.jpeg?v=2')
  ]);

  const pageMargin = 15;
  const pageWidth = doc.internal.pageSize.getWidth() - pageMargin * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  const headerHeight = 25; 
  const footerHeight = 15;
  
  let yPos = headerHeight;

  const addPageHeader = (pageNumber: number, totalPages: number) => {
    if (utLogoBase64) {
        doc.addImage(utLogoBase64, 'JPEG', pageMargin, 5, 15, 15);
    }
    
    if (abgLogoBase64) {
        doc.addImage(abgLogoBase64, 'JPEG', doc.internal.pageSize.getWidth() - pageMargin - 18, 5, 18, 15);
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("UltraTech Sieve Test Master", doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(data.testName || "Sieve Analysis Report", doc.internal.pageSize.getWidth() / 2, 18, { align: 'center' });

    doc.setDrawColor(180);
    doc.line(pageMargin, 22, doc.internal.pageSize.getWidth() - pageMargin, 22);
  };
  
  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        addPageHeader(i, pageCount); 
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            pageHeight - footerHeight / 2,
            { align: 'center'}
        );
        doc.text(
            `Generated on: ${format(new Date(), "PPpp")}`, 
            pageMargin, 
            pageHeight - footerHeight / 2,
            { align: 'left'}
        );
        doc.text(
            'UltraTech Sieve Test Master',
            doc.internal.pageSize.getWidth() - pageMargin,
            pageHeight - footerHeight / 2,
            { align: 'right' }
        );
    }
  }

  const checkAndAddPage = () => {
    if (yPos > pageHeight - footerHeight - 40) { 
        doc.addPage();
        yPos = headerHeight;
    }
  }
  
  const addSection = async (title: string, results: AnalysisResults, weights: number[], type: ExtendedAggregateType, sieves: number[], fineAggType?: FineAggregateType) => {
      checkAndAddPage();
      
      if (yPos > headerHeight) {
          yPos += 5;
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, pageMargin, yPos);
      yPos += 6;

      const summaryBody = [
          ['Aggregate Type', type === 'Fine' ? `${type} (${fineAggType})` : type],
          [type === 'Fine' ? 'Zone' : 'Classification', results.classification || 'N/A'],
          ['Fineness Modulus', results.finenessModulus?.toFixed(2) || 'N/A']
      ];
      autoTable(doc, {
          body: summaryBody,
          startY: yPos,
          theme: 'plain',
          tableWidth: pageWidth / 2,
          styles: { fontSize: 9, cellPadding: 1, textColor: [0, 0, 0] },
          columnStyles: { 0: { fontStyle: 'bold' } },
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;
      
      checkAndAddPage();

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Test Inputs", pageMargin, yPos);
      yPos += 5;
      
      const totalWeight = weights.reduce((acc, w) => acc + (w || 0), 0);
      autoTable(doc, {
          head: [['Sieve Size (mm)', 'Weight Retained (g)']],
          body: [...sieves.map((sieve, index) => [sieve.toString(), (weights?.[index] ?? 0).toFixed(1)]), ['Pan', (weights?.[sieves.length] ?? 0).toFixed(1)]],
          foot: [['Total', totalWeight.toFixed(1)]],
          startY: yPos,
          theme: 'grid',
          headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0] },
          footStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
          styles: { textColor: [0, 0, 0] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;

      checkAndAddPage();

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Tabulated Results", pageMargin, yPos);
      yPos += 5;
      
      const specLimits = getSpecLimitsForType(type, results.classification, fineAggType);
      
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
            limits ? (isOutOfSpec ? 'FAIL' : 'Pass') : 'N/A'
        ];
      });
      
      autoTable(doc, {
        head: [['Sieve (mm)', 'Wt. Ret (g)', '% Retained', 'Cum. % Retained', '% Passing', 'BIS Limits (%)', 'Remark']],
        body: tableBody,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontSize: 8, cellPadding: 1.5 },
        styles: { fontSize: 8, cellPadding: 1.5, textColor: [0, 0, 0] },
        columnStyles: { 4: {fontStyle: 'bold'}, 6: {halign: 'center'}},
        didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.dataKey === 6 && hookData.cell.raw === 'FAIL') {
                hookData.cell.styles.textColor = [255, 0, 0];
            }
            if (hookData.section === 'body' && type === 'Fine' && sieves[hookData.row.index] === 0.6) {
                hookData.cell.styles.fillColor = '#fef9c3';
            }
        },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
    
    checkAndAddPage();

    const chartId = `${type.replace(/\s+/g, '-')}-${fineAggType ? fineAggType.replace(/\s+/g, '-') : ''}-chart`;
    const chartImage = await getChartImage(chartId);
    
    const chartHeight = 70;
    const chartWidth = pageWidth;

    if (yPos + chartHeight > pageHeight - footerHeight) {
        doc.addPage();
        yPos = headerHeight;
    }
    
    if (chartImage) {
        doc.addImage(chartImage, 'JPEG', pageMargin, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 10;
    } else {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text("Chart could not be rendered.", pageMargin, yPos + 10);
        yPos += 20;
    }
  }

  const addPageBreakIfNeeded = () => {
    if ((doc as any).internal.getNumberOfPages() > 1 || yPos > headerHeight + 5) {
        doc.addPage();
        yPos = headerHeight;
    }
  }

  if (data.fineNaturalSandResults) {
    await addSection('Fine Aggregate (Natural Sand) Results', data.fineNaturalSandResults, data.fineNaturalSandWeights, 'Fine', SIEVE_SIZES.FINE, 'Natural Sand');
  }
  if (data.fineCrushedSandResults) {
    addPageBreakIfNeeded();
    await addSection('Fine Aggregate (Crushed Sand) Results', data.fineCrushedSandResults, data.fineCrushedSandWeights, 'Fine', SIEVE_SIZES.FINE, 'Crushed Sand');
  }
  if (data.coarseGradedResults) {
    addPageBreakIfNeeded();
    await addSection('Coarse Aggregate (Graded) Results', data.coarseGradedResults, data.coarseGradedWeights, 'Coarse - Graded', SIEVE_SIZES.COARSE_GRADED);
  }
  if (data.coarseSingle20mmResults) {
    addPageBreakIfNeeded();
    await addSection('Coarse Aggregate (20mm) Results', data.coarseSingle20mmResults, data.coarseSingle20mmWeights, 'Coarse - 20mm', SIEVE_SIZES.COARSE_SINGLE_20MM);
  }
  if (data.coarseSingle10mmResults) {
    addPageBreakIfNeeded();
    await addSection('Coarse Aggregate (10mm) Results', data.coarseSingle10mmResults, data.coarseSingle10mmWeights, 'Coarse - 10mm', SIEVE_SIZES.COARSE_SINGLE_10MM);
  }

  if(data.showCombined && data.combinedChartData.length > 0) {
    addPageBreakIfNeeded();

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Combined Gradation Results', pageMargin, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let blendText = '';
    if (data.blendSelection.fine.length > 0 || data.blendSelection.coarse.length > 0) {
        const fineParts = data.blendSelection.fine.map(f => `${data.blendPercentages[f.fineAggType]}% ${f.fineAggType}`);
        const coarseParts = data.blendSelection.coarse.map(c => `${data.blendPercentages[c.type]}% ${c.type}`);
        const parts = [...fineParts, ...coarseParts];
        blendText = `Blend: ${parts.join(', ')}.`;
    }

    doc.text(blendText, pageMargin, yPos);
    yPos += 8;
    
    checkAndAddPage();
    
    const sortedData = [...data.combinedChartData].sort((a, b) => b.sieveSize - a.sieveSize);
    autoTable(doc, {
        head: [['Sieve (mm)', 'Combined Passing (%)', 'BIS Limit (%)', 'Remark']],
        body: sortedData.map(row => {
            const isOutOfSpec = row.combinedPassing < row.lowerLimit || row.combinedPassing > row.upperLimit;
            return [
                row.sieveSize.toFixed(2),
                row.combinedPassing.toFixed(2),
                row.bisLimit.toFixed(2),
                isOutOfSpec ? 'FAIL' : 'Pass'
            ]
        }),
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { textColor: [0, 0, 0] },
        didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 3 && hookData.cell.raw === 'FAIL') {
                hookData.cell.styles.textColor = [255, 0, 0];
                hookData.cell.styles.fontStyle = 'bold';
            }
             if (hookData.section === 'body' && parseFloat(hookData.row.cells[0].text[0]) === 0.6) {
                hookData.cell.styles.fillColor = '#fef9c3';
            }
        },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
    
    checkAndAddPage();

    const combinedChartImage = await getChartImage('combined-gradation-chart');
    const chartHeight = 80;
    
    if (yPos + chartHeight > pageHeight - footerHeight) {
        doc.addPage();
        yPos = headerHeight;
    }

    if (combinedChartImage) {
      doc.addImage(combinedChartImage, 'JPEG', pageMargin, yPos, pageWidth, chartHeight);
    }
  }

  addFooter();
  doc.save(`${data.testName || "sieve-analysis"}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
