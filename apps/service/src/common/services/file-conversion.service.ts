import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface FileConversionResult {
  success: boolean;
  text?: string;
  error?: string;
  fileName?: string;
  duration?: number;
}

export interface ConvertFileDto {
  file: Buffer;
  mimeType: string;
  originalName: string;
}

@Injectable()
export class FileConversionService {
  private readonly logger = new Logger(FileConversionService.name);
  private readonly tempDir: string;
  private readonly openAiApiKey?: string;
  private readonly whisperModel: string;

  constructor() {
    this.tempDir = os.tmpdir();
    this.openAiApiKey = process.env.OPENAI_API_KEY;
    this.whisperModel = process.env.WHISPER_MODEL || 'whisper-1';
  }

  async convertFile(dto: ConvertFileDto): Promise<FileConversionResult> {
    const startTime = Date.now();
    const { file, mimeType, originalName } = dto;

    try {
      let text: string;

      if (this.isPdf(mimeType)) {
        text = await this.convertPdf(file);
      } else if (this.isDocx(mimeType)) {
        text = await this.convertDocx(file);
      } else if (this.isAudio(mimeType)) {
        text = await this.convertAudio(file, originalName, mimeType);
      } else {
        return {
          success: false,
          error: `Unsupported file type: ${mimeType}`,
          fileName: originalName,
          duration: Date.now() - startTime,
        };
      }

      return {
        success: true,
        text: text.trim(),
        fileName: originalName,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Failed to convert file ${originalName}: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed',
        fileName: originalName,
        duration: Date.now() - startTime,
      };
    }
  }

  async convertFileFromPath(filePath: string, mimeType: string): Promise<FileConversionResult> {
    const startTime = Date.now();
    const originalName = path.basename(filePath);

    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      return await this.convertFile({ file: fileBuffer, mimeType, originalName });
    } catch (error) {
      this.logger.error(`Failed to read file ${filePath}: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
        fileName: originalName,
        duration: Date.now() - startTime,
      };
    }
  }

  private isPdf(mimeType: string): boolean {
    return mimeType === 'application/pdf' || mimeType === 'application/x-pdf';
  }

  private isDocx(mimeType: string): boolean {
    return (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    );
  }

  private isAudio(mimeType: string): boolean {
    const audioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mp4',
      'audio/x-m4a',
      'audio/x-ms-wma',
      'audio/ogg',
      'audio/webm',
    ];
    return audioTypes.includes(mimeType.toLowerCase());
  }

  private async convertPdf(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);
      return data.text;
    } catch (error) {
      this.logger.error(`PDF conversion error: ${error}`);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async convertDocx(buffer: Buffer): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.error(`DOCX conversion error: ${error}`);
      throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async convertAudio(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    if (!this.openAiApiKey) {
      throw new Error('OpenAI API key not configured. Audio transcription requires OPENAI_API_KEY.');
    }

    const tempFilePath = path.join(this.tempDir, `audio_${Date.now()}_${originalName}`);

    try {
      await fs.promises.writeFile(tempFilePath, buffer);

      const formData = new FormData();
      const blob = new Blob([buffer], { type: mimeType });
      formData.append('file', blob, originalName);
      formData.append('model', this.whisperModel);
      formData.append('response_format', 'text');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openAiApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
      }

      const text = await response.text();
      return text;
    } finally {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  getSupportedTypes(): string[] {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/mp4',
      'audio/x-m4a',
    ];
  }

  isSupported(mimeType: string): boolean {
    return (
      this.isPdf(mimeType) || this.isDocx(mimeType) || this.isAudio(mimeType)
    );
  }
}
