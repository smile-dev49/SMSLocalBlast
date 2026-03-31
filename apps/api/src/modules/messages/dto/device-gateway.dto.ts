import { z } from 'zod';

export const DeviceGatewayLoginBodySchema = z
  .object({
    deviceIdentifier: z.string().min(1).max(128),
    secret: z.string().min(8).max(256),
  })
  .strict();

export const DeviceGatewayPullBodySchema = z
  .object({
    batteryLevel: z.number().int().min(0).max(100).optional(),
    signalStrength: z.number().int().min(-150).max(0).optional(),
    networkType: z.string().max(32).optional(),
    appVersion: z.string().max(64).optional(),
    currentQueueCapacity: z.number().int().min(0).max(1000).optional(),
    lastKnownStatus: z.string().max(64).optional(),
    capabilities: z.record(z.unknown()).optional(),
  })
  .strict();

export const GatewayAckDispatchBodySchema = z
  .object({
    idempotencyKey: z.string().min(1).max(128),
  })
  .strict();

export const GatewayReportSentBodySchema = z
  .object({
    idempotencyKey: z.string().min(1).max(128),
    providerReference: z.string().max(128).optional(),
    sentAt: z.string().datetime().optional(),
    transportMetadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const GatewayReportDeliveredBodySchema = z
  .object({
    idempotencyKey: z.string().min(1).max(128),
    deliveredAt: z.string().datetime().optional(),
    transportMetadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const GatewayReportFailedBodySchema = z
  .object({
    idempotencyKey: z.string().min(1).max(128),
    failureCode: z.string().min(1).max(64),
    failureReason: z.string().max(512).optional(),
    retryable: z.boolean().optional(),
    transportMetadata: z.record(z.unknown()).optional(),
  })
  .strict();

export type DeviceGatewayLoginBody = z.infer<typeof DeviceGatewayLoginBodySchema>;
export type DeviceGatewayPullBody = z.infer<typeof DeviceGatewayPullBodySchema>;
export type GatewayAckDispatchBody = z.infer<typeof GatewayAckDispatchBodySchema>;
export type GatewayReportSentBody = z.infer<typeof GatewayReportSentBodySchema>;
export type GatewayReportDeliveredBody = z.infer<typeof GatewayReportDeliveredBodySchema>;
export type GatewayReportFailedBody = z.infer<typeof GatewayReportFailedBodySchema>;
