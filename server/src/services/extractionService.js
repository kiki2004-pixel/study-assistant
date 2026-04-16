const fs = require('fs');

async function extractText(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    return extractPdf(filePath);
  }
  if (mimeType === 'text/plain') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  if (['image/png', 'image/jpeg', 'image/jpg'].includes(mimeType)) {
    return extractImageText(filePath, mimeType);
  }
  return '';
}

async function extractPdf(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF extraction error:', err.message);
    return '';
  }
}

async function extractImageText(filePath, mimeType) {
  try {
    // Use Groq vision model for image text extraction
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');

    const response = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: 'Extract all visible text from this image. Return only the text content, preserving structure where possible.',
            },
          ],
        },
      ],
    });
    return response.choices[0].message.content || '';
  } catch (err) {
    console.error('Image extraction error:', err.message);
    return '';
  }
}

module.exports = { extractText };
