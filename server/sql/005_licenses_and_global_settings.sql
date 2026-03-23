DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_status') THEN
    CREATE TYPE license_status AS ENUM (
      'active',
      'revoked',
      'expired',
      'suspended'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_code VARCHAR(64) NOT NULL UNIQUE,
  buyer_username VARCHAR(255),
  activated_domain VARCHAR(255),
  status license_status NOT NULL DEFAULT 'active',
  last_check_in TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_purchase_code ON licenses (purchase_code);
CREATE INDEX IF NOT EXISTS idx_licenses_activated_domain ON licenses (activated_domain);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses (status);

CREATE TABLE IF NOT EXISTS global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(64) NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO global_settings (key, value) VALUES
  ('latest_version', '1.0.0'),
  ('release_notes', 'Initial release')
ON CONFLICT (key) DO NOTHING;
