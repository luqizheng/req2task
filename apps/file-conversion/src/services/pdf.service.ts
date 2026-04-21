import type { ConversionResult } from '../types.js';

export class PdfService {
  async convert(buffer: Buffer): Promise<ConversionResult> {
    const startTime = Date.now();

    try {
      const pdfParse = await import('pdf-parse');

      const data = await pdfParse.default(buffer);

      return {
        success: true,
        text: data.text.trim(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }
}
