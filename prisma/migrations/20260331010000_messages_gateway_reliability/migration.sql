-- Messages execution + gateway reliability foundation

CREATE SCHEMA IF NOT EXISTS "public";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageChannelType') THEN
    CREATE TYPE "MessageChannelType" AS ENUM ('SMS', 'MMS');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageStatus') THEN
    CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'READY', 'QUEUED', 'DISPATCHING', 'DISPATCHED', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED', 'CANCELLED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageDirection') THEN
    CREATE TYPE "MessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');
  END IF;
END $$;

DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGES_GENERATED_FOR_CAMPAIGN'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_QUEUED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_RETRY_SCHEDULED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_CANCELLED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_FAILED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_DISPATCHED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'DEVICE_GATEWAY_AUTHENTICATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_CLAIMED_BY_DEVICE'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_SENT_REPORTED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_DELIVERED_REPORTED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'MESSAGE_FAILED_REPORTED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_FINALIZED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'OPERATIONS_VIEWED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS "authSecretHash" TEXT;
ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS "lastAuthenticatedAt" TIMESTAMP(3);
ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS "lastTokenIssuedAt" TIMESTAMP(3);
ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS "deviceAuthVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS "lastDispatchAt" TIMESTAMP(3);

CREATE TABLE "OutboundMessage" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "campaignId" TEXT,
  "campaignRecipientId" TEXT,
  "deviceId" TEXT,
  "contactId" TEXT,
  "channelType" "MessageChannelType" NOT NULL DEFAULT 'SMS',
  "direction" "MessageDirection" NOT NULL DEFAULT 'OUTBOUND',
  "normalizedPhoneNumber" TEXT NOT NULL,
  "renderedBody" TEXT NOT NULL,
  "mediaUrl" TEXT,
  "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
  "failureCode" TEXT,
  "failureReason" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 3,
  "nextRetryAt" TIMESTAMP(3),
  "scheduledAt" TIMESTAMP(3),
  "queuedAt" TIMESTAMP(3),
  "dispatchingAt" TIMESTAMP(3),
  "dispatchedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "claimedAt" TIMESTAMP(3),
  "claimIdempotencyKey" TEXT,
  "providerReference" TEXT,
  "lastStatusAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutboundMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageStatusEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "outboundMessageId" TEXT NOT NULL,
  "fromStatus" "MessageStatus",
  "toStatus" "MessageStatus" NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageGatewayEventReceipt" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "outboundMessageId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageGatewayEventReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MessageGatewayEventReceipt_outboundMessageId_eventType_idempotencyKey_key"
  ON "MessageGatewayEventReceipt"("outboundMessageId","eventType","idempotencyKey");
CREATE INDEX "OutboundMessage_organizationId_idx" ON "OutboundMessage"("organizationId");
CREATE INDEX "OutboundMessage_campaignId_idx" ON "OutboundMessage"("campaignId");
CREATE INDEX "OutboundMessage_campaignRecipientId_idx" ON "OutboundMessage"("campaignRecipientId");
CREATE INDEX "OutboundMessage_deviceId_idx" ON "OutboundMessage"("deviceId");
CREATE INDEX "OutboundMessage_status_idx" ON "OutboundMessage"("status");
CREATE INDEX "OutboundMessage_scheduledAt_idx" ON "OutboundMessage"("scheduledAt");
CREATE INDEX "OutboundMessage_nextRetryAt_idx" ON "OutboundMessage"("nextRetryAt");
CREATE INDEX "OutboundMessage_organizationId_status_idx" ON "OutboundMessage"("organizationId","status");
CREATE INDEX "OutboundMessage_campaignId_status_idx" ON "OutboundMessage"("campaignId","status");
CREATE INDEX "MessageStatusEvent_outboundMessageId_idx" ON "MessageStatusEvent"("outboundMessageId");
CREATE INDEX "MessageStatusEvent_organizationId_idx" ON "MessageStatusEvent"("organizationId");
CREATE INDEX "MessageStatusEvent_createdAt_idx" ON "MessageStatusEvent"("createdAt");
CREATE INDEX "MessageGatewayEventReceipt_organizationId_idx" ON "MessageGatewayEventReceipt"("organizationId");
CREATE INDEX "MessageGatewayEventReceipt_createdAt_idx" ON "MessageGatewayEventReceipt"("createdAt");

ALTER TABLE "OutboundMessage"
  ADD CONSTRAINT "OutboundMessage_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundMessage"
  ADD CONSTRAINT "OutboundMessage_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundMessage"
  ADD CONSTRAINT "OutboundMessage_campaignRecipientId_fkey"
  FOREIGN KEY ("campaignRecipientId") REFERENCES "CampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundMessage"
  ADD CONSTRAINT "OutboundMessage_deviceId_fkey"
  FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundMessage"
  ADD CONSTRAINT "OutboundMessage_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MessageStatusEvent"
  ADD CONSTRAINT "MessageStatusEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageStatusEvent"
  ADD CONSTRAINT "MessageStatusEvent_outboundMessageId_fkey"
  FOREIGN KEY ("outboundMessageId") REFERENCES "OutboundMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageGatewayEventReceipt"
  ADD CONSTRAINT "MessageGatewayEventReceipt_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageGatewayEventReceipt"
  ADD CONSTRAINT "MessageGatewayEventReceipt_outboundMessageId_fkey"
  FOREIGN KEY ("outboundMessageId") REFERENCES "OutboundMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
