import { Module } from '@nestjs/common';
import { ApiTokensController } from './api-tokens.controller';
import { ApiTokensService } from './api-tokens.service';

@Module({
  controllers: [ApiTokensController],
  providers: [ApiTokensService],
  exports: [ApiTokensService],
})
export class ApiTokensModule {}
