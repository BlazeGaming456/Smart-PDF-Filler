import { fillAcroForm } from "@/lib/fillAcroForm.js";
import { fillOCR } from "@/lib/fillOCR.js";
import { fillOCRSimple } from "@/lib/fillOCRSimple.js";

export const POST = async (req) => {
  try {
    const formData = await req.formData();

    const file = formData.get("pdf"); // The uploaded file
    const name = formData.get("name"); // The name field

    if (!file) {
      return new Response(JSON.stringify({ error: "No PDF uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!name) {
      return new Response(JSON.stringify({ error: "No name provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Read file into ArrayBuffer
    const pdfBytes = new Uint8Array(await file.arrayBuffer());

    let filledPdf;

    try {
      filledPdf = await fillAcroForm(pdfBytes, name);
    } catch (error) {
      console.log(
        "No fields found!, trying OCR approach:",
        error.message
      );
      try {
        filledPdf = await fillOCRSimple(pdfBytes, name);
      } catch (e) {
        console.log(
          "OCR approach failed!",
          e.message
        );
      }
    }

    return new Response(filledPdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=filled_form.pdf",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
