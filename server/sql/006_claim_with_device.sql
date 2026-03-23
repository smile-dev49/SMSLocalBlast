-- Extend claim_next_message to accept optional device_id for multi-device tracking
DROP FUNCTION IF EXISTS public.claim_next_message(uuid);

CREATE OR REPLACE FUNCTION public.claim_next_message(
  p_user_id uuid,
  p_device_id uuid DEFAULT NULL
)
RETURNS messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m messages;
BEGIN
  SELECT * INTO m
  FROM messages
  WHERE user_id = p_user_id AND status = 'pending'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE messages
  SET status = 'assigned',
      device_id = p_device_id,
      updated_at = NOW()
  WHERE id = m.id
  RETURNING * INTO m;

  IF p_device_id IS NOT NULL THEN
    UPDATE devices
    SET last_seen_at = NOW()
    WHERE id = p_device_id AND user_id = p_user_id;
  END IF;

  RETURN m;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_next_message(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_next_message(uuid, uuid) TO service_role;
