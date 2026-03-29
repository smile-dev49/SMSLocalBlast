import { Injectable } from '@nestjs/common';
import { API_HEALTH_PATH } from '@sms-localblast/constants';

export interface HealthStatusDto {
  readonly path: typeof API_HEALTH_PATH;
  readonly status: 'ok';
}

@Injectable()
export class HealthService {
  getStatus(): HealthStatusDto {
    return { path: API_HEALTH_PATH, status: 'ok' };
  }
}
