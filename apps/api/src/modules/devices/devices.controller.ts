import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DevicesService } from './devices.service';

@ApiTags('Devices')
@Controller({ path: 'devices', version: '1' })
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}
}
