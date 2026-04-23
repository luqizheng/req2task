import { PdfService } from './pdf.service.js';
import { DocxService } from './docx.service.js';
import { AudioService } from './audio.service.js';
import {
  ConversionResult,
  isPdf,
  isDocx,
  isAudio,
  SUPPORTED_MIME_TYPES,
} from '../types.js';

export class ConversionService {
  private pdfService: PdfService;
  private docxService: DocxService;
  private audioService: AudioService;

  constructor(
    openAiApiKey: string,
    whisperModel: string = 'whisper-1',
    aiChatServiceUrl: string = 'http://localhost:4001'
  ) {
    this.pdfService = new PdfService();
    this.docxService = new DocxService();
    this.audioService = new AudioService(openAiApiKey, whisperModel, aiChatServiceUrl);
  }

  async convert(
    buffer: Buffer,
    mimeType: string,
    originalName: string
  ): Promise<ConversionResult> {
    if (isPdf(mimeType)) {
      return this.pdfService.convert(buffer);
    }

    if (isDocx(mimeType)) {
      return this.docxService.convert(buffer);
    }

    if (isAudio(mimeType)) {
      return this.audioService.convert(buffer, originalName, mimeType);
    }

    return {
      success: false,
      error: `Unsupported file type: ${mimeType}. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`,
      duration: 0,
    };
  }

  isSupported(mimeType: string): boolean {
    return isPdf(mimeType) || isDocx(mimeType) || isAudio(mimeType);
  }

  getSupportedTypes(): string[] {
    return [...SUPPORTED_MIME_TYPES];
  }
}
