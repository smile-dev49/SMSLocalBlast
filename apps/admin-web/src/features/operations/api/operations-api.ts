import { httpRequest } from '@/core/network/http-client';

export type QueueSummary = Record<string, number>;

export interface StuckMessageRow {
  readonly id: string;
  readonly organizationId: string;
  readonly deviceId: string | null;
  readonly dispatchingAt: string | null;
}

export interface DeviceAvailability {
  readonly all: number;
  readonly eligible: number;
  readonly unavailable: number;
}

export const operationsApi = {
  queueSummary: () => httpRequest<QueueSummary>('/operations/queues/summary'),

  stuckMessages: () => httpRequest<readonly StuckMessageRow[]>('/operations/messages/stuck'),

  devicesAvailability: () => httpRequest<DeviceAvailability>('/operations/devices/availability'),
};
