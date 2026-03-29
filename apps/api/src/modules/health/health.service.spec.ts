import { Test, TestingModule } from '@nestjs/testing';
import { API_HEALTH_PATH } from '@sms-localblast/constants';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok', () => {
    expect(service.getStatus()).toEqual({
      path: API_HEALTH_PATH,
      status: 'ok',
    });
  });
});
