-- Guarded rename:
-- This migration can run before DeviceHeartbeat exists (e.g. shadow DB),
-- so only rename if the old index is present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'DeviceHeartbeat_deviceId_createdAt_desc_idx'
      AND n.nspname = 'public'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'DeviceHeartbeat_deviceId_createdAt_idx'
      AND n.nspname = 'public'
  ) THEN
    ALTER INDEX "DeviceHeartbeat_deviceId_createdAt_desc_idx"
      RENAME TO "DeviceHeartbeat_deviceId_createdAt_idx";
  END IF;
END $$;
