export interface RequestContextStore {
  readonly requestId: string;
  readonly userId?: string;
  readonly organizationId?: string;
  readonly ip: string;
  readonly userAgent: string;
}
