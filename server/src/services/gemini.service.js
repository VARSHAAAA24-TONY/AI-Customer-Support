const https = require('https');

/**
 * Generates a chat response stream using Google Gemini via Raw HTTPS.
 * This bypasses SDK-related 'API_KEY_INVALID' errors occurring in the 2026 environment.
 * 
 * @param {Array} messages - Standard OpenAI message format [{role, content}, ...]
 * @returns {AsyncGenerator} - A generator that yields chunks compatible with the existing OpenAI stream consumer.
 */
const getGeminiStream = async (messages) => {
  const apiKey = process.env.GEMINI_API_KEY;
  // Use gemini-flash-latest which is the stable alias in 2026
  const model = "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Extract system instruction
  const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
  
  // Format history for Gemini API
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }]
    }));

  const payload = {
    contents: contents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    }
  };

  return (async function* () {
    const responsePromise = new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        if (res.statusCode !== 200) {
          let errorBody = '';
          res.on('data', d => errorBody += d);
          res.on('end', () => reject(new Error(`Gemini API Error (${res.statusCode}): ${errorBody}`)));
          return;
        }
        resolve(res);
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });

    const res = await responsePromise;

    // Stream processing for SSE (Server-Sent Events)
    let buffer = '';
    for await (const chunk of res) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep partial line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.replace('data: ', '').trim();
            if (!jsonStr) continue;
            
            const data = JSON.parse(jsonStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (text) {
              yield {
                choices: [{
                  delta: { content: text }
                }]
              };
            }
          } catch (e) {
            // Ignore incomplete chunks or parse errors
          }
        }
      }
    }
  })();
};

/**
 * Neural Vision: Extract text from a buffer (PDF/Image) using Gemini 1.5 Flash.
 * This is the ultimate fallback for scanned or "void" documents.
 */
const getNeuralVisionText = async (buffer, mimetype) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = "gemini-1.5-flash-latest"; // Best for high-speed multi-modal
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [
        { text: "Extract all text from this document accurately. Preserving the structure if possible. Output ONLY the extracted text." },
        {
          inlineData: {
            mimeType: mimetype || "application/pdf",
            data: buffer.toString('base64')
          }
        }
      ]
    }]
  };

  try {
    const responsePromise = new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          if (res.statusCode !== 200) reject(new Error(`Gemini Vision Error (${res.statusCode}): ${body}`));
          else resolve(JSON.parse(body));
        });
      });
      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });

    const data = await responsePromise;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    console.warn('[Gemini Vision] Failed to extract text:', err.message);
    return '';
  }
};

module.exports = { 
  getGeminiStream,
  getNeuralVisionText
};
