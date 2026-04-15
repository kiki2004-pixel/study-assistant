const fs = require('fs');
const path = require('path');

async function extractText(filePath, mimeType, anthropic) {
  if (mimeType === 'application/pdf') {
    return extractPdf(filePath);
  }
  if (mimeType === 'text/plain') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  if (['image/png', 'image/jpeg', 'image/jpg'].includes(mimeType)) {
    return extractImageText(filePath, mimeType, anthropic);
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

async function extractImageText(filePath, mimeType, anthropic) {
  try {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64 },
            },
            {
              type: 'text',
              text: 'Extract all visible text from this image. Return only the text content, preserving structure where possible.',
            },
          ],
        },
      ],
    });
    return response.content[0].text || '';
  } catch (err) {
    console.error('Image extraction error:', err.message);
    return '';
  }
}

module.exports = { extractText };
