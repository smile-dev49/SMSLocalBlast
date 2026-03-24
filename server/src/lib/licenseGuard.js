/**
 * License Guard — calls the master license server to verify purchase code.
 * If LICENSE_SERVER_URL and PURCHASE_CODE are not set, verification is skipped (dev/demo).
 * Checks on startup and every 24 hours; invalid license triggers process.exit(1).
 */

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

let lastValidCheck = null;
let scheduledCheck = null;

export function isLicenseCheckEnabled() {
  const url = process.env.LICENSE_SERVER_URL?.trim();
  const code = process.env.PURCHASE_CODE?.trim();
  return Boolean(url && code);
}

export function getDomain() {
  const origin = process.env.PUBLIC_ORIGIN?.trim() || '';
  if (!origin) return 'localhost';
  try {
    const u = new URL(origin);
    return u.hostname || 'localhost';
  } catch {
    return 'localhost';
  }
}

export async function verifyLicense() {
  const url = process.env.LICENSE_SERVER_URL?.trim();
  const code = process.env.PURCHASE_CODE?.trim();

  if (!url || !code) {
    return { valid: true, skipped: true };
  }

  const domain = getDomain();
  const verifyUrl = url.replace(/\/$/, '') + '/api/v1/verify-license';

  try {
    const res = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_code: code, domain }),
    });

    const data = await res.json().catch(() => ({}));

    if (data.valid) {
      lastValidCheck = Date.now();
      return { valid: true };
    }

    return {
      valid: false,
      reason: data.reason || 'License verification failed',
    };
  } catch (err) {
    console.error('[license] Verify failed:', err.message);
    if (lastValidCheck && Date.now() - lastValidCheck < CHECK_INTERVAL_MS) {
      return { valid: true };
    }
    return {
      valid: false,
      reason: err.message || 'Could not reach license server',
    };
  }
}

export function scheduleNextCheck() {
  if (scheduledCheck) clearTimeout(scheduledCheck);

  scheduledCheck = setTimeout(async () => {
    const result = await verifyLicense();
    if (!result.valid && !result.skipped) {
      console.error('[license] Invalid:', result.reason);
      process.exit(1);
    }
    scheduleNextCheck();
  }, CHECK_INTERVAL_MS);
}

export async function assertValidLicense() {
  const result = await verifyLicense();
  if (result.valid) return;

  console.error('[license] License invalid:', result.reason);
  process.exit(1);
}
