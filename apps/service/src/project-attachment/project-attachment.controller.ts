import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { ProjectAttachmentService } from './project-attachment.service';
import {
  UploadAttachmentDto,
  AttachmentQueryDto,
  BatchGetAttachmentsDto,
} from '@req2task/dto';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class ProjectAttachmentController {
  constructor(private readonly attachmentService: ProjectAttachmentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Body() dto: UploadAttachmentDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.attachmentService.upload(dto, file.buffer, file.originalname, file.mimetype, userId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.attachmentService.findById(id);
  }

  @Get()
  async findByTarget(@Query() query: AttachmentQueryDto) {
    return this.attachmentService.findByTarget(query);
  }

  @Post('batch')
  async batchGet(@Body() dto: BatchGetAttachmentsDto) {
    return this.attachmentService.batchGet(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.attachmentService.delete(id);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, fileData, attachment } = await this.attachmentService.download(id);
    
    res.set({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.displayName)}"`,
    });
    
    return new StreamableFile(stream);
  }
}
