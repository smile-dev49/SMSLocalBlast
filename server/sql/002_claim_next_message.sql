CREATE OR REPLACE FUNCTION public.claim_next_message(p_user_id uuid)
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
  SET status = 'assigned', updated_at = NOW()
  WHERE id = m.id
  RETURNING * INTO m;

  RETURN m;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_next_message(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_next_message(uuid) TO service_role;
