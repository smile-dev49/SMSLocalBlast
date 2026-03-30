import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Audit Logs')
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogsController {}
