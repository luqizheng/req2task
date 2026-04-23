import type { ConversionResult } from '../types.js';

export class DocxService {
  async convert(buffer: Buffer): Promise<ConversionResult> {
    const startTime = Date.now();

    try {
      const mammoth = await import('mammoth');

      const result = await mammoth.extractRawText({ buffer });

      if (result.messages && result.messages.length > 0) {
        console.warn('DOCX conversion warnings:', result.messages);
      }

      return {
        success: true,
        text: result.value.trim(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }
}
