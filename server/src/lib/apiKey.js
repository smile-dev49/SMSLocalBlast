import crypto from 'crypto';

const PREFIX_LEN = 12;
const SECRET_LEN = 32;

function hashKey(key) {
  return crypto.createHash('sha256').update(key, 'utf8').digest('hex');
}

export function generateApiKey() {
  const prefix = 'sk_' + crypto.randomBytes(4).toString('hex');
  const secret = crypto.randomBytes(SECRET_LEN).toString('hex');
  const key = prefix + secret;
  return {
    key,
    keyHash: hashKey(key),
    keyPrefix: prefix,
  };
}

export function verifyApiKey(providedKey, keyHash) {
  if (!providedKey || !keyHash) return false;
  return crypto.timingSafeEqual(
    Buffer.from(hashKey(providedKey), 'hex'),
    Buffer.from(keyHash, 'hex')
  );
}
