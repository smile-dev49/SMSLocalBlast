import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';

@ApiTags('Sessions')
@Controller({ path: 'sessions', version: '1' })
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}
}
