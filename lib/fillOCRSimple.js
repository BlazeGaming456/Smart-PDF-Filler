import { createWorker } from "tesseract.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import pdf from "pdf-poppler";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Convert only first page of PDF bytes to a PNG and return the image path.
 * Uses pdf-poppler; requires poppler / pdftoppm installed in the environment.
 */
async function pdfToImage(pdfBytes, outputDir = "./temp", outPrefix = "page") {
  // ensure directory
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const tempPdfPath = path.join(outputDir, `temp_${Date.now()}.pdf`);
  await writeFile(tempPdfPath, pdfBytes);

  const options = {
    format: "png",
    out_dir: outputDir,
    out_prefix: outPrefix,
    page: 1, // convert first page only
  };

  try {
    await pdf.convert(tempPdfPath, options);

    // find matching files created by pdf-poppler with the out_prefix and .png extension
    const files = (await readdir(outputDir)).filter(
      (f) =>
        f.startsWith(outPrefix) &&
        (f.endsWith(".png") || f.endsWith(".PNG") || f.endsWith(".jpg"))
    );

    if (!files || files.length === 0) {
      throw new Error("pdf-poppler did not produce an image file in outputDir");
    }

    // choose the most-recently modified file (defensive)
    const fullPaths = files.map((f) => path.join(outputDir, f));
    fullPaths.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    const imagePath = fullPaths[0];

    // cleanup temp pdf
    await unlink(tempPdfPath).catch(() => {});

    return imagePath;
  } catch (err) {
    // try to clean temp pdf even on error
    await unlink(tempPdfPath).catch(() => {});
    throw err;
  }
}

/**
 * Use Tesseract to detect where "name" label is on the image and return
 * coordinates converted to PDF coordinates (pdf-lib uses bottom-left origin).
 *
 * Returns:
 *  { x: Number, y: Number, width: Number, height: Number, confidence: Number, fieldText: String, strategy: "ocr_detected" }
 * or null when none found.
 */
async function findNameFieldPosition(imagePath, pdfWidth, pdfHeight, logger = console) {
  const worker = createWorker({
    // optional logger from tesseract for debugging:
    logger: (m) => logger.debug ? logger.debug("[tesseract]", m) : logger.log("[tesseract]", m),
  });

  try {
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    // Page segmentation mode: 6 or 3 are usually good for forms. Try 6 (Assume a uniform block of text).
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      // you can add other params here if needed
    });

    const { data } = await worker.recognize(imagePath);
    const { words = [], imageWidth, imageHeight } = data;

    logger.log(`OCR found ${words.length} words. image ${imageWidth}x${imageHeight}`);
    if (!words || !words.length) return null;

    // Normalize words and group into horizontal lines by center-y
    const lines = new Map();
    function lineKey(y) {
      // bucket lines by ~10px vertically (adjust if needed)
      return Math.round(y / 10) * 10;
    }

    for (const w of words) {
      // Tesseract word bbox: { x0, y0, x1, y1 } where y0=top, y1=bottom
      const ycenter = (w.bbox.y0 + w.bbox.y1) / 2;
      const key = lineKey(ycenter);
      if (!lines.has(key)) lines.set(key, []);
      lines.get(key).push(Object.assign({}, w, {
        text: (w.text || "").trim(),
        x0: w.bbox.x0,
        y0: w.bbox.y0,
        x1: w.bbox.x1,
        y1: w.bbox.y1,
      }));
    }

    // build candidate text lines (joined)
    const candidates = [];
    for (const [k, arr] of lines.entries()) {
      // sort left->right
      arr.sort((a, b) => a.x0 - b.x0);
      const joined = arr.map((w) => w.text).join(" ").replace(/\s+/g, " ").toLowerCase();
      candidates.push({ key: k, words: arr, text: joined });
    }

    // search for name-like patterns
    const nameRegex = /\b(full name|first name|last name|given name|family name|surname|name)\b[:\s\-_]*/i;
    let best = null;

    for (const c of candidates) {
      const match = c.text.match(nameRegex);
      if (match) {
        // find which words in c.words correspond to the matched substring
        const joinedWords = c.words.map((w) => w.text).join(" ");
        const lowerJoined = joinedWords.toLowerCase();

        // find index of the match in the joined words string (approximate)
        const idx = lowerJoined.indexOf(match[0].toLowerCase().trim());
        // approximate mapping back to words: locate first word that contains first token of match
        let startWordIndex = 0;
        let charCount = 0;
        const tokens = joinedWords.split(" ");
        for (let i = 0; i < tokens.length; ++i) {
          if (charCount >= idx) {
            startWordIndex = i;
            break;
          }
          charCount += tokens[i].length + 1;
          startWordIndex = i + 1;
        }

        // compute bbox for matched words (and attempt to include following underscores if present)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let confidenceSum = 0, confidenceCount = 0;

        // include matched words
        for (let i = startWordIndex; i < c.words.length; ++i) {
          const w = c.words[i];
          minX = Math.min(minX, w.x0);
          minY = Math.min(minY, w.y0);
          maxX = Math.max(maxX, w.x1);
          maxY = Math.max(maxY, w.y1);
          confidenceSum += w.confidence || 0;
          confidenceCount++;
          // stop after capturing label tokens (heuristic): stop after seeing a colon or if we've included 3 words
          if ((w.text || "").includes(":") || i - startWordIndex > 2) break;
        }

        // look to the right on the same line for underscores / blank area (common for fill-in fields)
        const rightWords = c.words.filter((w) => w.x0 > maxX && (w.text || "").trim().length > 0);
        for (const rw of rightWords) {
          if (/^_+$/.test(rw.text) || rw.text.includes("______") || rw.text.length > 5 && /^[-_]+$/.test(rw.text)) {
            // include underscores in bbox
            maxX = Math.max(maxX, rw.x1);
            maxY = Math.max(maxY, rw.y1);
            minY = Math.min(minY, rw.y0);
          } else {
            // if there is a short gap (a likely blank area) we might treat this as the field
            // but simplest: only include explicit underscores for now
          }
        }

        const avgConfidence = confidenceCount ? confidenceSum / confidenceCount : 0;

        // convert to PDF coords (pdf-lib origin bottom-left)
        const scaleX = pdfWidth / imageWidth;
        const scaleY = pdfHeight / imageHeight;

        const pdfX = minX * scaleX;
        // Use bottom coordinate (maxY) when flipping Y:
        const pdfY = pdfHeight - maxY * scaleY;
        const pdfW = (maxX - minX) * scaleX;
        const pdfH = (maxY - minY) * scaleY;

        best = {
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          confidence: avgConfidence,
          fieldText: match[0].trim(),
          strategy: "ocr_detected",
          imageBox: { minX, minY, maxX, maxY },
          imageSize: { width: imageWidth, height: imageHeight },
        };

        // choose the first good match with reasonable confidence
        if (avgConfidence > 30) break;
      }
    }

    await worker.terminate();
    return best || null;
  } catch (err) {
    try { await worker.terminate(); } catch (e) {}
    throw err;
  }
}

/**
 * Main function: fills the first page with `name`. Uses acroform fields if present,
 * else tries OCR detection and falls back to common positions.
 */
export async function fillOCRSimple(pdfBytes, name) {
  let tempImagePath = null;

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // acroform context (you said this part already works)
    const form = pdfDoc.getForm();
    const availableFields = form.getFields().map((f) => f.getName());
    let position = null;

    // Try OCR -> image
    try {
      tempImagePath = await pdfToImage(pdfBytes, "./temp", "page");
      const ocrPos = await findNameFieldPosition(tempImagePath, width, height, console);

      if (ocrPos) {
        // We'll place text slightly to the right of the detected label box
        // compute insertion coordinates (center vertically within label height)
        const fontSize = 12;
        const insetX = 6; // gap to place text after label
        const insertX = ocrPos.x + ocrPos.width + insetX;
        const insertY = ocrPos.y + Math.max(0, (ocrPos.height - fontSize) / 2);

        position = {
          x: insertX,
          y: insertY,
          strategy: "ocr_detected",
          confidence: ocrPos.confidence,
        };
      }
    } catch (err) {
      console.log("OCR conversion/processing failed, will fallback. Error:", err.message);
    } finally {
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        await unlink(tempImagePath).catch(() => {});
        tempImagePath = null;
      }
    }

    // If OCR didn't yield anything, use smarter heuristics (fields or common positions)
    if (!position) {
      // prefer acroform named fields if present
      const nameFields = availableFields.filter((f) =>
        /name|full/i.test(f)
      );

      if (nameFields.length > 0) {
        // place roughly around top-left quarter (adjustable)
        position = {
          x: width * 0.3,
          y: height * 0.75,
          strategy: "name_field_detected",
          confidence: 0.8,
        };
      } else {
        // common fallback positions (tuned for typical A4 portrait)
        position = {
          x: width * 0.25,
          y: height * 0.65,
          strategy: "common_position",
          confidence: 0.6,
        };
      }
    }

    console.log(`Choosing position x=${position.x}, y=${position.y} (strategy=${position.strategy})`);

    // embed a standard font and measure width so we don't overflow page edge
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let fontSize = 12;
    let textWidth = helvetica.widthOfTextAtSize(name, fontSize);

    // shrink font if it would overflow page width
    const rightMargin = 20;
    if (position.x + textWidth + rightMargin > width) {
      const available = Math.max(30, width - position.x - rightMargin);
      const newSize = Math.floor((fontSize * available) / Math.max(1, textWidth));
      if (newSize < fontSize) {
        fontSize = Math.max(8, newSize);
        textWidth = helvetica.widthOfTextAtSize(name, fontSize);
      }
    }

    // final insertion (pdf-lib expects y to be baseline coordinate)
    firstPage.drawText(name, {
      x: position.x,
      y: position.y,
      size: fontSize,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    const outBytes = await pdfDoc.save();
    return outBytes;
  } catch (err) {
    console.error("Failed to fill PDF:", err);
    throw err;
  } finally {
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      try { await unlink(tempImagePath); } catch (e) {}
    }
  }
}
