import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ConversionResult {
  success: boolean;
  text?: string;
  error?: string;
  duration?: number;
}

interface ConversionResponse {
  success: boolean;
  text?: string;
  error?: string;
  duration?: number;
}

@Injectable()
export class FileConversionClientService {
  private readonly logger = new Logger(FileConversionClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env['FILE_CONVERSION_SERVICE_URL'] || 'http://localhost:4002';
  }

  async transcribeAudio(
    audioData: string,
    mimeType: string,
    originalName: string = 'audio.mp3',
  ): Promise<ConversionResult> {
    try {
      this.logger.log(`Transcribing audio: ${originalName}, mimeType: ${mimeType}`);

      const response = await firstValueFrom(
        this.httpService.post<ConversionResponse>(
          `${this.baseUrl}/convert/sync`,
          {
            file: audioData,
            mimeType,
            originalName,
          },
          {
            timeout: 120000,
          },
        ),
      );

      if (response.data.success) {
        this.logger.log(`Audio transcription completed: ${response.data.duration}ms`);
        return {
          success: true,
          text: response.data.text,
          duration: response.data.duration,
        };
      } else {
        this.logger.error(`Audio transcription failed: ${response.data.error}`);
        return {
          success: false,
          error: response.data.error || 'Unknown error',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Audio transcription error: ${errorMessage}`);
      return {
        success: false,
        error: `Audio transcription failed: ${errorMessage}`,
      };
    }
  }
}
