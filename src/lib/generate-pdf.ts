
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";

export async function generatePdf(reportElement: HTMLElement, testName: string) {
  // Add a class to the element for PDF-specific styling
  reportElement.classList.add("pdf-render");

  const canvas = await html2canvas(reportElement, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
    logging: true,
    allowTaint: true,
    onclone: (document) => {
      // On clone, we can ensure styles are applied
      const clonedElement = document.getElementById(reportElement.id);
      if (clonedElement) {
        clonedElement.classList.add("pdf-render");
      }
    }
  });

  // Remove the class after rendering to not affect the UI
  reportElement.classList.remove("pdf-render");

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = imgWidth / imgHeight;
  
  const pageImgWidth = pdfWidth;
  const pageImgHeight = pageImgWidth / ratio;

  let heightLeft = imgHeight;
  let position = 0;

  // Add the first page
  pdf.addImage(imgData, "PNG", 0, position, pageImgWidth, pageImgHeight);
  heightLeft -= imgHeight * (pdfHeight / pageImgHeight);

  // Add new pages if the content is longer than one page
  while (heightLeft > 0) {
    position = heightLeft - imgHeight * (pdfHeight / pageImgHeight);
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pageImgWidth, pageImgHeight);
    heightLeft -= imgHeight * (pdfHeight / pageImgHeight);
  }

  doc.save(`${testName || "sieve-analysis"}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
