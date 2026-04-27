import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, HttpCode, HttpStatus, Get, Query, Delete, Param, ParseUUIDPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { FileDataService } from './file-data.service';
import { User } from '@req2task/core';

@Controller('file-data')
@UseGuards(JwtAuthGuard)
export class FileDataController {
  constructor(private readonly fileDataService: FileDataService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    console.log("上传文件", user);
    const fileData = await this.fileDataService.uploadFile(file.buffer, file.originalname, file.mimetype, user.id);
    return { fileDataId: fileData.id };
  }

  @Get('batch')
  async getBatch(@Query('ids') ids: string) {
    const idArray = ids ? ids.split(',') : [];
    const fileDataList = await this.fileDataService.findByIds(idArray);
    return { fileDataList };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.fileDataService.delete(id);
  }
}