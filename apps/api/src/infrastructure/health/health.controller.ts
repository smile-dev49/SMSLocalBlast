import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import type { HealthLiveResponse, HealthReadyResponse } from './health.dto';
import { HealthService } from './health.service';

@ApiTags('Health')
@Public()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe (process only)' })
  getLive(): HealthLiveResponse {
    return this.healthService.getLive();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (database + redis)' })
  async getReady(@Res({ passthrough: true }) res: Response): Promise<HealthReadyResponse> {
    const body = await this.healthService.getReady();
    res.status(body.status === 'ready' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return body;
  }
}
