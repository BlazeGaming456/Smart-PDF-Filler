import { PDFDocument } from "pdf-lib";

export const POST = async (req) => {
    const formData = await req.formData();

    const file = formData.get("pdf");

    if (!file) {
        return new Response(JSON.stringify({ error: "No PDF uploaded"}), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }

    const pdfBytes = new Uint8Array(await file.arrayBuffer());
    let fieldsList = [];

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log("Total fields found:", fields.length);
    console.log("Field details:");
    for (const field of fields) {
        try {
            const fullyQualifiedName = field.getFullyQualifiedName ? field.getFullyQualifiedName() : "N/A";
            console.log(`- Name: "${field.getName()}", Type: ${field.constructor.name}, FullyQualifiedName: "${fullyQualifiedName}"`);
        } catch (e) {
            console.log(`- Name: "${field.getName()}", Type: ${field.constructor.name}, FullyQualifiedName: "N/A"`);
        }
        fieldsList.push({name: field.getName(), value: ""});
    }

    // If no fields found, let's check if there are any annotations or other form elements
    if (fields.length === 0) {
        console.log("No AcroForm fields found. Checking for other form elements...");
        
        // Check all pages for annotations
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const annotations = page.node.Annots;
            if (annotations) {
                console.log(`Page ${i + 1} has ${annotations.length} annotations`);
                for (let j = 0; j < annotations.length; j++) {
                    const annotation = annotations[j];
                    console.log(`  Annotation ${j + 1}: Type: ${annotation.Subtype?.toString()}`);
                }
            } else {
                console.log(`Page ${i + 1} has no annotations`);
            }
        }
    }

    return new Response(JSON.stringify({ fields: fieldsList}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    })
}