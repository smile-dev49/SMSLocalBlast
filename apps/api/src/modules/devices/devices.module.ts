import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DevicesRepository } from './devices.repository';
import { DevicesHealthService } from './devices-health.service';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService, DevicesRepository, DevicesHealthService],
  exports: [DevicesService],
})
export class DevicesModule {}
