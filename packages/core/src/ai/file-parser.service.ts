import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FileContent } from './ai-chat.service';

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);

  async parse(file: FileContent): Promise<{ content: string; type: string }> {
    switch (file.type) {
      case 'text':
        return { content: file.data, type: 'text' };

      case 'docx':
        return this.parseDocx(file);

      case 'pdf':
        return this.parsePdf(file);

      case 'audio':
        return this.parseAudio(file);

      default:
        throw new BadRequestException(`Unsupported file type: ${file.type}`);
    }
  }

  async parseFromPath(
    filePath: string,
  ): Promise<{ content: string; type: string }> {
    return { content: `[File: ${filePath}]`, type: 'text' };
  }

  private async parseDocx(file: FileContent): Promise<{ content: string; type: string }> {
    try {
      const mammoth = await import('mammoth');
      const buffer = Buffer.from(file.data, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      return { content: result.value.trim(), type: 'docx' };
    } catch (error) {
      this.logger.warn(`Failed to parse DOCX: ${error}`);
      return {
        content: `[DOCX 内容 - 解析失败]\n${file.data.substring(0, 1000)}`,
        type: 'docx',
      };
    }
  }

  private async parsePdf(file: FileContent): Promise<{ content: string; type: string }> {
    try {
      const pdfParse = await import('pdf-parse');
      const buffer = Buffer.from(file.data, 'base64');
      const data = await pdfParse.default(buffer);
      return { content: data.text.trim(), type: 'pdf' };
    } catch (error) {
      this.logger.warn(`Failed to parse PDF: ${error}`);
      return {
        content: `[PDF 内容 - 解析失败]\n${file.data.substring(0, 1000)}`,
        type: 'pdf',
      };
    }
  }

  private async parseAudio(file: FileContent): Promise<{ content: string; type: string }> {
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!openAiApiKey) {
      return {
        content: `[音频文件: ${file.name || 'unknown'}]\n(需要配置 OPENAI_API_KEY 使用语音识别转录)`,
        type: 'audio',
      };
    }

    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey: openAiApiKey });
      const buffer = Buffer.from(file.data, 'base64');
      const model = process.env.WHISPER_MODEL || 'whisper-1';

      const transcription = await client.audio.transcriptions.create({
        file: new File([buffer], file.name || 'audio.mp3', { type: 'audio/mpeg' }),
        model,
        response_format: 'text',
      });

      return { content: transcription.trim(), type: 'audio' };
    } catch (error) {
      this.logger.warn(`Failed to transcribe audio: ${error}`);
      return {
        content: `[音频文件: ${file.name || 'unknown'}]\n(语音识别失败: ${error instanceof Error ? error.message : 'Unknown error'})`,
        type: 'audio',
      };
    }
  }
}
