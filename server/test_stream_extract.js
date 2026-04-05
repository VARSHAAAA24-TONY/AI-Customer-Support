const { PDFDocument, PDFRawStream, PDFName } = require('pdf-lib');
const fs = require('fs');

async function extractStreams() {
    const buffer = fs.readFileSync('uploads/c6cf1582fbe90394f8a27f6b19a45b1d');
    const pdfDoc = await PDFDocument.load(buffer);
    const pdfObjectIds = Object.keys(pdfDoc.context.indirectObjects);
    
    console.log('Total Objects:', pdfObjectIds.length);
    let imageCount = 0;

    for (const id of pdfObjectIds) {
        const obj = pdfDoc.context.indirectObjects[id];
        if (obj instanceof PDFRawStream) {
            const dict = obj.dict;
            const filter = dict.get(PDFName.of('Filter'));
            
            // Check for JPEG streams
            if (filter === PDFName.of('DCTDecode') || (Array.isArray(filter) && filter.includes(PDFName.of('DCTDecode')))) {
                imageCount++;
                const contents = obj.contents;
                console.log(`Found JPEG Image! Size: ${contents.length} bytes`);
                // We can save this and pass to Tesseract!
            }
        }
    }
    console.log('Total Images Found:', imageCount);
}

extractStreams().catch(err => console.error(err));
