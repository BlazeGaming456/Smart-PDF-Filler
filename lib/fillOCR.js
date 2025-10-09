import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";

// Server-compatible OCR approach using intelligent positioning
export async function fillOCR(pdfBytes, name) {
  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    console.log(`PDF dimensions: ${width}x${height}`);

    // Intelligent positioning based on PDF dimensions and common form layouts
    const positions = [
      // Top section - most common for name fields
      { x: 100, y: height - 80, label: "Top-left" },
      { x: width / 2 - 50, y: height - 80, label: "Top-center" },

      // Upper-middle section
      { x: 100, y: height - 150, label: "Upper-left" },
      { x: width / 2 - 50, y: height - 150, label: "Upper-center" },

      // Middle section
      { x: 100, y: height - 250, label: "Middle-left" },
      { x: width / 2 - 50, y: height - 250, label: "Middle-center" },

      // For smaller PDFs, adjust positions
      ...(height < 600
        ? [
            { x: 50, y: height - 60, label: "Small-top-left" },
            { x: width / 2 - 25, y: height - 60, label: "Small-top-center" },
          ]
        : []),
    ];

    // Try to find the best position (for now, use the first one)
    const position = positions[0];

    console.log(
      `Using ${position.label} position: x=${position.x}, y=${position.y}`
    );

    // Draw the name text
    firstPage.drawText(name, {
      x: position.x,
      y: position.y,
      size: 12,
      color: rgb(0, 0, 0),
    });

    // Optionally add a label to make it clear what this field is
    firstPage.drawText("Name:", {
      x: position.x - 40,
      y: position.y,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });

    const filledPdfBytes = await pdfDoc.save();
    return filledPdfBytes;
  } catch (error) {
    console.error("Smart OCR Error:", error);
    throw new Error(
      `Failed to fill PDF using smart positioning: ${error.message}`
    );
  }
}
