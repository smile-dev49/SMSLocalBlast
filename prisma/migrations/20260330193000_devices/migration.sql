-- Adds Device + DeviceHeartbeat models, and expands AuditAction with device lifecycle events.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DevicePlatform') THEN
    CREATE TYPE "DevicePlatform" AS ENUM ('ANDROID', 'IOS');
  END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeviceStatus') THEN
    CREATE TYPE "DeviceStatus" AS ENUM ('PENDING', 'ONLINE', 'OFFLINE', 'SUSPENDED', 'DISCONNECTED');
  END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeviceHealthStatus') THEN
    CREATE TYPE "DeviceHealthStatus" AS ENUM ('HEALTHY', 'WARNING', 'CRITICAL', 'UNKNOWN');
  END IF;
END $$;

-- Expand AuditAction enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
    ALTER TYPE "AuditAction" ADD VALUE 'DEVICE_CREATED';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
    ALTER TYPE "AuditAction" ADD VALUE 'DEVICE_UPDATED';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
    ALTER TYPE "AuditAction" ADD VALUE 'DEVICE_DELETED';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
    ALTER TYPE "AuditAction" ADD VALUE 'DEVICE_PRIMARY_SET';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
    ALTER TYPE "AuditAction" ADD VALUE 'DEVICE_QUOTA_UPDATED';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
    ALTER TYPE "AuditAction" ADD VALUE 'DEVICE_HEARTBEAT_RECEIVED';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "name" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "appVersion" TEXT,
    "osVersion" TEXT,
    "deviceModel" TEXT,
    "deviceIdentifier" TEXT NOT NULL,
    "pushToken" TEXT,
    "phoneNumber" TEXT,
    "simLabel" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'PENDING',
    "healthStatus" "DeviceHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "dailySendLimit" INTEGER NOT NULL DEFAULT 1000,
    "hourlySendLimit" INTEGER NOT NULL DEFAULT 100,
    "dailySentCount" INTEGER NOT NULL DEFAULT 0,
    "hourlySentCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),
    "lastKnownIp" TEXT,
    "metadata" JSONB,
    "capabilities" JSONB,
    "lastQuotaResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DeviceHeartbeat" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL,
    "batteryLevel" INTEGER,
    "signalStrength" INTEGER,
    "networkType" TEXT,
    "appVersion" TEXT,
    "ipAddress" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceHeartbeat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeviceHeartbeat" ADD CONSTRAINT "DeviceHeartbeat_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceHeartbeat" ADD CONSTRAINT "DeviceHeartbeat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceIdentifier_key" ON "Device"("deviceIdentifier");

-- CreateIndex
CREATE INDEX "Device_organizationId_idx" ON "Device"("organizationId");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE INDEX "Device_platform_idx" ON "Device"("platform");

-- CreateIndex
CREATE INDEX "Device_lastHeartbeatAt_idx" ON "Device"("lastHeartbeatAt");

-- CreateIndex
CREATE INDEX "Device_organizationId_isActive_idx" ON "Device"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Device_organizationId_status_idx" ON "Device"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DeviceHeartbeat_deviceId_idx" ON "DeviceHeartbeat"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceHeartbeat_organizationId_idx" ON "DeviceHeartbeat"("organizationId");

-- CreateIndex
CREATE INDEX "DeviceHeartbeat_deviceId_createdAt_desc_idx" ON "DeviceHeartbeat"("deviceId", "createdAt" DESC);

