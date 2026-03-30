import { Injectable, Logger } from '@nestjs/common';
import type { AuditEmitter, AuditEventInput } from '../../common/types/audit.types';

/**
 * Records audit events. Today: structured logs. Later: `AuditLog` rows + Bull fan-out.
 */
@Injectable()
export class AuditLogService implements AuditEmitter {
  private readonly logger = new Logger(AuditLogService.name);

  emit(event: AuditEventInput): Promise<void> {
    this.logger.log({ msg: 'audit.emit', ...event });
    return Promise.resolve();
  }
}
