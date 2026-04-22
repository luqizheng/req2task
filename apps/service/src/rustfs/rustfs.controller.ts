import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RustFSService } from './rustfs.service';
import { JwtAuthGuard } from '../common/guards';
import { PresignPutRequestDto, PresignPutResponseDto, PresignGetResponseDto } from '@req2task/dto';

@Controller('rustfs')
@UseGuards(JwtAuthGuard)
export class RustFSController {
  constructor(private readonly rustFSService: RustFSService) {}

  @Get('presign-put')
  async getPresignedPutUrl(@Query() dto: PresignPutRequestDto): Promise<PresignPutResponseDto> {
    return this.rustFSService.getPresignedPutUrl(dto);
  }

  @Get('presign-get/:fileDataId')
  async getPresignedGetUrl(@Param('fileDataId') fileDataId: string): Promise<PresignGetResponseDto> {
    return this.rustFSService.getPresignedGetUrl(decodeURIComponent(fileDataId));
  }
}
