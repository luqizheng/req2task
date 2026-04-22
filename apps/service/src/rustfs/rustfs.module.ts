import { Module } from '@nestjs/common';
import { RustFSService } from './rustfs.service';
import { RustFSController } from './rustfs.controller';

@Module({
  controllers: [RustFSController],
  providers: [RustFSService],
  exports: [RustFSService],
})
export class RustFSModule {}
