import { PDFDocument } from "pdf-lib";

export async function fillAcroForm(pdfBytes, name) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const form = pdfDoc.getForm();
    if (form.getFields().length === 0) {
      throw new Error("No form fields found in PDF!");
    }

    // Get all field names to help with debugging
    const fieldNames = form.getFields().map((field) => field.getName());
    console.log("Available form fields:", fieldNames);

    // Try to find a name field (case-insensitive)
    const nameFieldName = fieldNames.find((fieldName) =>
      fieldName.toLowerCase().includes("name")
    );

    if (!nameFieldName) {
      throw new Error(
        `No name field found. Available fields: ${fieldNames.join(", ")}`
      );
    }

    const nameField = form.getTextField(nameFieldName);
    nameField.setText(name);
    form.flatten();

    return await pdfDoc.save();
  } catch (error) {
    console.error("Error filling PDF form:", error);
    throw new Error(`Failed to fill PDF form: ${error.message}`);
  }
}