import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { FileDataService } from './file-data.service';

@Controller('file-data')
@UseGuards(JwtAuthGuard)
export class FileDataController {
  constructor(private readonly fileDataService: FileDataService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    const fileData = await this.fileDataService.uploadFile(file.buffer, file.originalname, file.mimetype, userId);
    return { fileDataId: fileData.id };
  }
}