import type { AuditAction } from '@prisma/client';

/**
 * Contract for emitting structured audit events.
 * Current implementation logs; future milestone can persist to Prisma `AuditLog`.
 */
export interface AuditEventInput {
  readonly action: AuditAction;
  readonly entityType?: string;
  readonly entityId?: string;
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
