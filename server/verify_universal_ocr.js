const { parseFile } = require('./src/services/parser.service');
const fs = require('fs');
const path = require('path');

async function verifyUniversalOCR() {
    // Problematic file identified earlier
    const file = path.resolve('uploads', 'c6cf1582fbe90394f8a27f6b19a45b1d');
    if (!fs.existsSync(file)) {
        console.error('File not found:', file);
        return;
    }

    console.log(`--- UNIVERSAL OCR TEST ---`);
    console.log(`Testing file: ${file}`);
    console.time('UniversalProcess');

    try {
        const text = await parseFile(file, 'application/pdf', '12_6Feb26.pdf');
        console.timeEnd('UniversalProcess');
        
        console.log('\n--- EXTRACTION RESULT ---');
        console.log('Text Length:', text.length);
        console.log('Sample Text:');
        console.log(text.substring(0, 1000));
        console.log('-------------------------');
        
        if (text.length > 50) {
            console.log('SUCCESS: Universal OCR successfully extracted text from a non-searchable PDF!');
        } else {
            console.warn('WARNING: Text extracted was very short. OCR might need more resolution/contrast.');
        }
    } catch (err) {
        console.timeEnd('UniversalProcess');
        console.error('CRITICAL ERROR:', err.message);
    }
}

verifyUniversalOCR();
