import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import OpenAI from 'openai';
import type { ConversionResult } from '../types.js';

export class AudioService {
  private client: OpenAI | null = null;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'whisper-1') {
    this.apiKey = apiKey;
    this.model = model;

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async convert(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<ConversionResult> {
    const startTime = Date.now();

    if (!this.client) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Audio transcription requires OPENAI_API_KEY.',
        duration: Date.now() - startTime,
      };
    }

    const tempDir = os.tmpdir();
    const ext = this.getExtension(mimeType);
    const tempFile = join(tempDir, `audio_${Date.now()}_${originalName}.${ext}`);

    try {
      await writeFile(tempFile, buffer);

      const fileStream = Bun.file(tempFile);

      const transcription = await this.client.audio.transcriptions.create({
        file: new File([buffer], originalName, { type: mimeType }),
        model: this.model,
        response_format: 'text',
      });

      return {
        success: true,
        text: transcription.trim(),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: `Audio transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    } finally {
      try {
        await unlink(tempFile);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  private getExtension(mimeType: string): string {
    const extMap: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/mp4': 'm4a',
      'audio/x-m4a': 'm4a',
    };
    return extMap[mimeType] || 'audio';
  }
}
