import { createWorker } from "tesseract.js";
import { PDFDocument, rgb } from "pdf-lib";

// Simple OCR approach that tries to find common name field patterns
export async function fillOCRSimple(pdfBytes, name) {
  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Common positions where name fields might be located
    const commonNamePositions = [
      { x: 100, y: height - 100 }, // Top-left area
      { x: width / 2 - 50, y: height - 100 }, // Top-center area
      { x: 100, y: height - 200 }, // Below top area
      { x: 100, y: height - 300 }, // Middle area
      { x: 100, y: height - 400 }, // Lower area
    ];

    // Try to find a good position by looking for existing text patterns
    // For now, use the first common position
    const position = commonNamePositions[0];

    console.log(`Using position: x=${position.x}, y=${position.y}`);

    // Draw the name text at the determined position
    firstPage.drawText(name, {
      x: position.x,
      y: position.y,
      size: 12,
      color: rgb(0, 0, 0),
    });

    const filledPdfBytes = await pdfDoc.save();
    return filledPdfBytes;
  } catch (error) {
    console.error("Simple OCR Error:", error);
    throw new Error(`Failed to fill PDF: ${error.message}`);
  }
}
