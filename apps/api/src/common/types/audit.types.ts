import type { AuditAction } from '@prisma/client';

export interface AuditEventInput {
  readonly action: AuditAction;
  readonly resource: string;
  readonly resourceId?: string;
  readonly organizationId?: string;
  readonly actorUserId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly requestId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface AuditEmitter {
  emit(event: AuditEventInput): Promise<void>;
}
