-- No-op: the index rename belongs after DeviceHeartbeat exists (see 20260330193100_device_heartbeat_index_rename).
-- A previous version of this migration ran too early in the chain and failed on shadow database replay (P1014).
SELECT 1;
