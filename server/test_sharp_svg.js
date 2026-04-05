const sharp = require('sharp');

async function testSharpSvg() {
    const svg = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
    try {
        console.log('Testing Sharp SVG support...');
        const buffer = await sharp(Buffer.from(svg))
            .toFormat('png')
            .toBuffer();
        console.log('SUCCESS: Sharp can render SVG! Buffer size:', buffer.length);
    } catch (err) {
        console.error('FAILED: Sharp cannot render SVG:', err.message);
    }
}

testSharpSvg();
