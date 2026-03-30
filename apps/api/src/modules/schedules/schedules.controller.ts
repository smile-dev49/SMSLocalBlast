import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';

@ApiTags('Schedules')
@Controller({ path: 'schedules', version: '1' })
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}
}
