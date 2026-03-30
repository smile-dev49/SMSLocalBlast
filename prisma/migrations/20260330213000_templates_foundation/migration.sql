-- Templates + personalization foundation

CREATE SCHEMA IF NOT EXISTS "public";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TemplateChannelType') THEN
    CREATE TYPE "TemplateChannelType" AS ENUM ('SMS', 'MMS');
  END IF;
END $$;

DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'TEMPLATE_CREATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'TEMPLATE_UPDATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'TEMPLATE_DELETED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'TEMPLATE_VALIDATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'TEMPLATE_PREVIEW_RENDERED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE "Template" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "body" TEXT NOT NULL,
  "channelType" "TemplateChannelType" NOT NULL DEFAULT 'SMS',
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Template_organizationId_name_key" ON "Template"("organizationId", "name");
CREATE INDEX "Template_organizationId_idx" ON "Template"("organizationId");

ALTER TABLE "Template"
  ADD CONSTRAINT "Template_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Template"
  ADD CONSTRAINT "Template_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

