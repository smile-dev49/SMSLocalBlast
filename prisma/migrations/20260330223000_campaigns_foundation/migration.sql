-- Campaigns + recipient snapshots foundation

CREATE SCHEMA IF NOT EXISTS "public";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CampaignStatus') THEN
    CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PROCESSING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CampaignRecipientStatus') THEN
    CREATE TYPE "CampaignRecipientStatus" AS ENUM ('PENDING', 'SKIPPED', 'READY', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CampaignRecipientSourceType') THEN
    CREATE TYPE "CampaignRecipientSourceType" AS ENUM ('DIRECT_CONTACT', 'CONTACT_LIST', 'IMPORT_SNAPSHOT');
  END IF;
END $$;

DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_CREATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_UPDATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_DELETED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_PREVIEWED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_SCHEDULED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_STARTED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_PAUSED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_CANCELLED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CAMPAIGN_RECIPIENTS_PREPARED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "templateId" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "pausedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "timezone" TEXT,
  "metadata" JSONB,
  "target" JSONB,
  "missingVariableStrategy" TEXT NOT NULL DEFAULT 'empty',
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "readyCount" INTEGER NOT NULL DEFAULT 0,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "deliveredCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignRecipient" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "contactId" TEXT,
  "sourceType" "CampaignRecipientSourceType" NOT NULL,
  "sourceRefId" TEXT,
  "normalizedPhoneNumber" TEXT NOT NULL,
  "resolvedName" TEXT,
  "mergeFields" JSONB,
  "renderedBody" TEXT,
  "status" "CampaignRecipientStatus" NOT NULL DEFAULT 'PENDING',
  "skipReason" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "queuedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Campaign_organizationId_idx" ON "Campaign"("organizationId");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "Campaign_scheduledAt_idx" ON "Campaign"("scheduledAt");
CREATE INDEX "Campaign_organizationId_status_idx" ON "Campaign"("organizationId", "status");

CREATE INDEX "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");
CREATE INDEX "CampaignRecipient_organizationId_idx" ON "CampaignRecipient"("organizationId");
CREATE INDEX "CampaignRecipient_status_idx" ON "CampaignRecipient"("status");
CREATE INDEX "CampaignRecipient_normalizedPhoneNumber_idx" ON "CampaignRecipient"("normalizedPhoneNumber");
CREATE INDEX "CampaignRecipient_campaignId_status_idx" ON "CampaignRecipient"("campaignId", "status");

ALTER TABLE "Campaign"
  ADD CONSTRAINT "Campaign_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign"
  ADD CONSTRAINT "Campaign_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Campaign"
  ADD CONSTRAINT "Campaign_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CampaignRecipient"
  ADD CONSTRAINT "CampaignRecipient_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignRecipient"
  ADD CONSTRAINT "CampaignRecipient_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignRecipient"
  ADD CONSTRAINT "CampaignRecipient_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
