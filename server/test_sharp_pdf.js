const sharp = require('sharp');
const fs = require('fs');

async function testSharpPdf() {
    const buffer = fs.readFileSync('uploads/c6cf1582fbe90394f8a27f6b19a45b1d');
    try {
        console.log('Testing Sharp PDF support...');
        const image = await sharp(buffer, { pages: -1 })
            .toFormat('png')
            .toBuffer();
        console.log('SUCCESS: Sharp can render PDF! Buffer size:', image.length);
    } catch (err) {
        console.error('FAILED: Sharp cannot render PDF:', err.message);
    }
}

testSharpPdf();
