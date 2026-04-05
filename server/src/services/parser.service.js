const mammoth = require('mammoth');
const Papa = require('papaparse');
const fs = require('fs');
const pdf = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const path = require('path');
const zlib = require('zlib');
const { PDFDocument, PDFRawStream, PDFName } = require('pdf-lib');
const { getNeuralVisionText } = require('./gemini.service');

/**
 * Robust CSV extraction using PapaParse.
 */
const extractTextFromCSV = async (buffer) => {
  const csvString = buffer.toString('utf-8');
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const text = results.data.map(row => Object.values(row).join(' ')).join('\n');
        resolve(text);
      },
      error: (error) => reject(error),
    });
  });
};

/**
 * Decompress FlateDecode streams using Node zlib
 */
const decompressFlate = (data) => {
  try { return zlib.inflateSync(data); } 
  catch (e) { return data; }
};

/**
 * Advanced Universal OCR Pipeline (Deep Neural Scan)
 * Extracts hidden image streams from PDFs and processes them via Tesseract.
 */
const performAdvancedOCR = async (buffer, mimetype = 'application/pdf') => {
  console.log(`[Parser] Synchronizing Neural Vision for OCR...`);
  const worker = await createWorker('eng');
  
  try {
    let fullText = '';

    // IF PDF: Extract every possible image stream (lossy and lossless)
    if (mimetype === 'application/pdf' || buffer.slice(0, 4).toString() === '%PDF') {
      const pdfDoc = await PDFDocument.load(buffer);
      const pdfObjectIds = Object.keys(pdfDoc.context.indirectObjects);
      let seenStreams = new Set();
      let extractedImageCount = 0;

      for (const id of pdfObjectIds) {
        const obj = pdfDoc.context.indirectObjects[id];
        if (obj instanceof PDFRawStream) {
          const dict = obj.dict;
          const filter = dict.get(PDFName.of('Filter'))?.toString();
          const subtype = dict.get(PDFName.of('Subtype'))?.toString();

          const isImage = subtype === '/Image' || filter === '/DCTDecode' || filter === '/FlateDecode';

          if (isImage && !seenStreams.has(obj.contents)) {
            seenStreams.add(obj.contents);
            extractedImageCount++;
            
            let data = obj.contents;
            if (filter === '/FlateDecode') {
               data = decompressFlate(data);
            }

            try {
              const { data: { text } } = await worker.recognize(Buffer.from(data));
              if (text && text.trim().length > 5) {
                fullText += text + '\n---\n';
              }
            } catch (ocrErr) {
              // Fail silently for individual streams
            }
          }
        }
      }
      console.log(`[Parser] Deep Scan identified ${extractedImageCount} potential nodes.`);
    } 
    // IF DIRECT IMAGE: Standard OCR
    else {
      const { data: { text } } = await worker.recognize(buffer);
      fullText = text;
    }

    await worker.terminate();
    return fullText;
  } catch (err) {
    console.warn(`[Parser Neural Warning] Vision pipeline interrupted: ${err.message}`);
    await worker.terminate();
    return '';
  }
};

/**
 * Powerpoint / Office Format High-Fidelity Extraction
 */
const extractOfficeFormat = async (filePath) => {
  try {
    const { getTextExtractor } = require('office-text-extractor');
    const extractor = getTextExtractor();
    const absolutePath = path.resolve(filePath);
    return await extractor.extractText(absolutePath);
  } catch (err) {
    console.warn(`[Parser Office Error]`, err.message);
    return '';
  }
};

/**
 * Universal Ingestion Logic (Neural Triple Pass)
 */
const parseFile = async (filePath, mimetype, originalName = '') => {
  const fileToExtract = originalName || filePath;
  const extension = (fileToExtract.split('.').pop() || '').toLowerCase();
  
  console.log(`[Parser] Ingesting: ${fileToExtract} [${mimetype || extension}]`);

  try {
    const buffer = fs.readFileSync(filePath);

    // 1. RAW TEXT / LOGS
    if (extension === 'txt' || mimetype === 'text/plain') {
      return buffer.toString('utf-8');
    }

    // 2. STRUCTURED DATA (CSV)
    if (extension === 'csv' || mimetype === 'text/csv') {
      return await extractTextFromCSV(buffer);
    }

    // 3. WORD DOCUMENTS
    if (extension === 'docx') {
       try {
         const result = await mammoth.extractRawText({ buffer });
         if (result.value.trim().length > 0) return result.value;
       } catch (e) {} 
    }

    // 4. POWERPOINT / EXCEL / FALLBACK
    if (['pptx', 'xlsx', 'xls', 'ppt'].includes(extension)) {
       const officeText = await extractOfficeFormat(filePath);
       if (officeText && officeText.trim().length > 0) return officeText;
    }

    // 5. PDF (The Core Intelligence Logic)
    if (extension === 'pdf' || mimetype === 'application/pdf') {
      let text = '';
      
      // Pass 1: Standard Extraction
      try {
        const data = await pdf(buffer);
        text = data.text;
      } catch (err) {
        if (err.message.includes('password') || err.message.includes('encrypted')) {
          throw new Error('Neural Block Locked: This document is encrypted or password-protected.');
        }
      }

      // Pass 2/3: Neural Fallback for Low-Density Documents
      if (!text || text.trim().length < 50) {
        console.warn(`[Parser] Text Density Low. Initializing Triple Pass Sync...`);
        
        // Pass 2: Local Deep OCR (Flate Recovery)
        const ocrText = await performAdvancedOCR(buffer, 'application/pdf');
        
        if (ocrText && ocrText.trim().length > 20) {
           console.log(`[Parser] Neural OCR Success (Pass 2).`);
           return ocrText;
        }

        // Pass 3: Neural Vision (Gemini 1.5 Flash High-Precision Extraction)
        console.log(`[Parser] Initializing Pass 3: Neural Vision (AI-Powered Perception)...`);
        const visionText = await getNeuralVisionText(buffer, mimetype || 'application/pdf');
        
        if (visionText && visionText.trim().length > 0) {
           console.log(`[Parser] Neural Vision Success (Pass 3).`);
           return visionText;
        }
        
        // Final Void Check
        if (!text || text.trim().length === 0) {
           throw new Error('Extraction Void: Document contains no extractable text or visual symbols.');
        }
      }
      return text;
    }

    // 6. IMAGES (Neural Vision)
    if ((mimetype && mimetype.startsWith('image/')) || ['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
        console.log(`[Parser] Initializing Direct Neural Vision for Image...`);
        const visionText = await getNeuralVisionText(buffer, mimetype);
        if (visionText && visionText.trim().length > 0) return visionText;
        
        const ocrText = await performAdvancedOCR(buffer, mimetype);
        if (ocrText && ocrText.trim().length > 0) return ocrText;
        
        throw new Error('Neural Vision Failed: Could not identify symbols in image.');
    }

    // 7. FINAL FALLBACK (Deep Binary Search)
    const fallbackText = await extractOfficeFormat(filePath);
    if (fallbackText && fallbackText.trim().length > 0) return fallbackText;

    throw new Error(`Format Unsupported: .${extension} is currently restricted.`);
  } catch (err) {
    console.error(`[Parser Critical] Sync Failed for ${fileToExtract}:`, err.message);
    throw err;
  }
};

module.exports = { parseFile };
