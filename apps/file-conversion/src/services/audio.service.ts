import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import OpenAI from 'openai';
import type { ConversionResult } from '../types.js';

export class AudioService {
  private whisperClient: OpenAI | null = null;
  private apiKey: string;
  private whisperModel: string;
  private aiChatServiceUrl: string;

  constructor(
    apiKey: string,
    whisperModel: string = 'whisper-1',
    aiChatServiceUrl: string = 'http://localhost:4001'
  ) {
    this.apiKey = apiKey;
    this.whisperModel = whisperModel;
    this.aiChatServiceUrl = aiChatServiceUrl;

    if (apiKey) {
      this.whisperClient = new OpenAI({ apiKey });
    }
  }

  async convert(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<ConversionResult> {
    const startTime = Date.now();

    if (!this.whisperClient) {
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

      const transcription = await this.whisperClient.audio.transcriptions.create({
        file: new File([buffer], originalName, { type: mimeType }),
        model: this.whisperModel,
        response_format: 'text',
      });

      const transcribedText = transcription.trim();

      if (!transcribedText) {
        return {
          success: false,
          error: 'Audio transcription produced empty result',
          duration: Date.now() - startTime,
        };
      }

      const processedText = await this.processWithAIService(transcribedText);

      return {
        success: true,
        text: processedText,
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

  private async processWithAIService(text: string): Promise<string> {
    try {
      const response = await fetch(`${this.aiChatServiceUrl}/api/ai/text/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, task: 'transcription' }),
      });

      if (!response.ok) {
        console.warn(`AI service returned ${response.status}, using raw transcription`);
        return text;
      }

      const data = await response.json() as { code: number; data?: { result: string } };
      if (data.code === 0 && data.data?.result) {
        return data.data.result;
      }

      return text;
    } catch (error) {
      console.warn(`Failed to call AI service: ${error instanceof Error ? error.message : 'Unknown error'}, using raw transcription`);
      return text;
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
