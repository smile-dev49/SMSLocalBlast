-- Contacts + contact lists + custom fields foundation (Excel-ready import architecture).

CREATE SCHEMA IF NOT EXISTS "public";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactStatus') THEN
    CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'OPTED_OUT', 'ARCHIVED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactSource') THEN
    CREATE TYPE "ContactSource" AS ENUM ('MANUAL', 'CSV_IMPORT', 'XLSX_IMPORT', 'API', 'EXCEL_ADDIN');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContactCustomFieldValueType') THEN
    CREATE TYPE "ContactCustomFieldValueType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'JSON');
  END IF;
END $$;

DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_CREATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_UPDATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_DELETED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_OPTED_OUT'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_BLOCKED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_UNBLOCKED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_LIST_CREATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_LIST_UPDATED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_LIST_DELETED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_LIST_MEMBERS_ADDED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACT_LIST_MEMBER_REMOVED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACTS_IMPORT_PREVIEWED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AuditAction" ADD VALUE 'CONTACTS_IMPORT_CONFIRMED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "fullName" TEXT,
  "phoneNumber" TEXT NOT NULL,
  "normalizedPhoneNumber" TEXT NOT NULL,
  "email" TEXT,
  "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
  "source" "ContactSource" NOT NULL DEFAULT 'MANUAL',
  "notes" TEXT,
  "metadata" JSONB,
  "lastContactedAt" TIMESTAMP(3),
  "optedOutAt" TIMESTAMP(3),
  "blockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactList" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ContactList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactListMembership" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "contactListId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactListMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactCustomFieldValue" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "fieldValue" TEXT NOT NULL,
  "valueType" "ContactCustomFieldValueType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactCustomFieldValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Contact_organizationId_normalizedPhoneNumber_key" ON "Contact"("organizationId", "normalizedPhoneNumber");
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");
CREATE INDEX "Contact_status_idx" ON "Contact"("status");
CREATE INDEX "Contact_createdAt_idx" ON "Contact"("createdAt");

CREATE UNIQUE INDEX "ContactList_organizationId_name_key" ON "ContactList"("organizationId", "name");
CREATE INDEX "ContactList_organizationId_idx" ON "ContactList"("organizationId");

CREATE UNIQUE INDEX "ContactListMembership_contactId_contactListId_key" ON "ContactListMembership"("contactId", "contactListId");
CREATE INDEX "ContactListMembership_organizationId_idx" ON "ContactListMembership"("organizationId");
CREATE INDEX "ContactListMembership_contactListId_idx" ON "ContactListMembership"("contactListId");

CREATE UNIQUE INDEX "ContactCustomFieldValue_contactId_fieldKey_key" ON "ContactCustomFieldValue"("contactId", "fieldKey");
CREATE INDEX "ContactCustomFieldValue_organizationId_fieldKey_idx" ON "ContactCustomFieldValue"("organizationId", "fieldKey");

ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactList"
  ADD CONSTRAINT "ContactList_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactList"
  ADD CONSTRAINT "ContactList_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactListMembership"
  ADD CONSTRAINT "ContactListMembership_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactListMembership"
  ADD CONSTRAINT "ContactListMembership_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactListMembership"
  ADD CONSTRAINT "ContactListMembership_contactListId_fkey"
  FOREIGN KEY ("contactListId") REFERENCES "ContactList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContactCustomFieldValue"
  ADD CONSTRAINT "ContactCustomFieldValue_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactCustomFieldValue"
  ADD CONSTRAINT "ContactCustomFieldValue_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

