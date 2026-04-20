import { Module } from '@nestjs/common';
import { RouterService } from './router.service';
import { RouteMatcher } from './route-matcher';

@Module({
  providers: [RouterService, RouteMatcher],
  exports: [RouterService],
})
export class RouterModule {}
