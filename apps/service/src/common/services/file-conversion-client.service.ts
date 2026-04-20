import { Injectable, Logger, HttpService } from '@nestjs/common';

export interface FileConversionResult {
  success: boolean;
  text?: string;
  error?: string;
  duration: number;
}

@Injectable()
export class FileConversionClientService {
  private readonly logger = new Logger(FileConversionClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.FILE_CONVERSION_SERVICE_URL || 'http://localhost:4002';
  }

  async convertSync(file: Buffer, mimeType: string, originalName: string): Promise<FileConversionResult> {
    try {
      const base64 = file.toString('base64');

      const response = await this.httpService.axiosRef.post<FileConversionResult>(
        `${this.baseUrl}/convert/sync`,
        {
          file: base64,
          mimeType,
          originalName,
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`File conversion failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed',
        duration: 0,
      };
    }
  }

  async submitAsyncJob(
    file: Buffer,
    mimeType: string,
    originalName: string,
    callbackUrl?: string
  ): Promise<{ jobId: string; status: string }> {
    const base64 = file.toString('base64');

    const response = await this.httpService.axiosRef.post(
      `${this.baseUrl}/convert/async`,
      {
        file: base64,
        mimeType,
        originalName,
        callbackUrl,
      }
    );

    return response.data;
  }

  async getJobStatus(jobId: string): Promise<{
    jobId: string;
    status: string;
    result?: { text: string; duration: number };
    error?: string;
  }> {
    const response = await this.httpService.axiosRef.get(
      `${this.baseUrl}/convert/jobs/${jobId}`
    );
    return response.data;
  }

  async convertFileIfNeeded(file: Buffer, mimeType: string, originalName: string): Promise<string | null> {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/mp4',
      'audio/x-m4a',
    ];

    if (!supportedTypes.includes(mimeType)) {
      return null;
    }

    const result = await this.convertSync(file, mimeType, originalName);

    if (!result.success || !result.text) {
      this.logger.warn(`Failed to convert file ${originalName}: ${result.error}`);
      return null;
    }

    return result.text;
  }
}
