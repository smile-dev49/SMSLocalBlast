import { Controller, Get } from '@nestjs/common';
import { API_HEALTH_PATH } from '@sms-localblast/constants';
import { HealthService, type HealthStatusDto } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get(API_HEALTH_PATH)
  getHealth(): HealthStatusDto {
    return this.healthService.getStatus();
  }
}
