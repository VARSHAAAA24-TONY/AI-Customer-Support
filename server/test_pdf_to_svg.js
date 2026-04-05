const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const sharp = require('sharp');
const fs = require('fs');

// Mock DOM for SVGGraphics
class MockElement {
  constructor(name) {
    this.name = name;
    this.children = [];
    this.attributes = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  setAttributeNS(ns, k, v) { this.attributes[k] = v; }
  appendChild(child) { this.children.push(child); }
  toString() {
    let attrs = Object.keys(this.attributes).map(k => `${k}="${this.attributes[k]}"`).join(' ');
    let children = this.children.map(c => c.toString()).join('');
    return `<${this.name} ${attrs}>${children}</${this.name}>`;
  }
}

const mockDoc = {
  createElementNS: (ns, name) => new MockElement(name),
  createElement: (name) => new MockElement(name)
};

async function testPdfToSvg() {
    const data = new Uint8Array(fs.readFileSync('uploads/c6cf1582fbe90394f8a27f6b19a45b1d'));
    const loadingTask = pdfjs.getDocument({ data });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);
    
    console.log('Page loaded contents...');
    const viewport = page.getViewport({ scale: 2.0 });
    const operatorList = await page.getOperatorList();
    
    // Attempting SVG render in Node
    const svgGfx = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
    const svgElement = await svgGfx.getSVG(operatorList, viewport);
    
    console.log('SVG Rendered!');
    const svgString = svgElement.toString();
    console.log('SVG Length:', svgString.length);
    
    const pngBuffer = await sharp(Buffer.from(svgString)).toFormat('png').toBuffer();
    console.log('PNG Buffer Created! Size:', pngBuffer.length);
}

testPdfToSvg().catch(err => console.error(err));
