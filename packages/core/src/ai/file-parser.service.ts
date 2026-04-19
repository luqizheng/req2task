import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
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
    const ext = path.extname(filePath).toLowerCase();
    const content = await fs.readFile(filePath, 'utf-8');

    switch (ext) {
      case '.txt':
      case '.md':
        return { content, type: 'text' };

      case '.docx':
        return this.parseDocx({ type: 'docx', data: content });

      case '.pdf':
        return this.parsePdf({ type: 'pdf', data: content });

      case '.mp3':
      case '.wav':
      case '.m4a':
      case '.ogg':
        return this.parseAudio({ type: 'audio', data: content, name: filePath });

      default:
        return { content, type: 'text' };
    }
  }

  private parseDocx(file: FileContent): { content: string; type: string } {
    try {
      const content = this.extractTextFromDocx(file.data);
      return { content, type: 'docx' };
    } catch (error) {
      this.logger.warn(`Failed to parse DOCX: ${error}`);
      return {
        content: `[DOCX 内容 - 需要转录]\n${file.data.substring(0, 1000)}`,
        type: 'docx',
      };
    }
  }

  private parsePdf(file: FileContent): { content: string; type: string } {
    try {
      const content = this.extractTextFromPdf(file.data);
      return { content, type: 'pdf' };
    } catch (error) {
      this.logger.warn(`Failed to parse PDF: ${error}`);
      return {
        content: `[PDF 内容 - 需要转录]\n${file.data.substring(0, 1000)}`,
        type: 'pdf',
      };
    }
  }

  private parseAudio(file: FileContent): { content: string; type: string } {
    return {
      content: `[音频文件: ${file.name || 'unknown'}]\n需要使用语音识别转录为文本`,
      type: 'audio',
    };
  }

  private extractTextFromDocx(data: string): string {
    const docxRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    const matches: string[] = [];
    let match;

    while ((match = docxRegex.exec(data)) !== null) {
      if (match[1] && match[1].trim()) {
        matches.push(match[1].trim());
      }
    }

    return matches.join(' ').replace(/\s+/g, ' ').trim();
  }

  private extractTextFromPdf(data: string): string {
    const textStreams: string[] = [];
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;

    while ((match = streamRegex.exec(data)) !== null) {
      const streamContent = match[1];
      const textContent = this.extractTextFromPdfStream(streamContent);
      if (textContent) {
        textStreams.push(textContent);
      }
    }

    return textStreams.join('\n').trim() || data.substring(0, 2000);
  }

  private extractTextFromPdfStream(stream: string): string {
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    const matches: string[] = [];
    let match;

    while ((match = tjRegex.exec(stream)) !== null) {
      if (match[1]) {
        matches.push(match[1]);
      }
    }

    return matches.join(' ');
  }
}
