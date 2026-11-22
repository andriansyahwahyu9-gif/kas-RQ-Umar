// Web Crypto PBKDF2-SHA256 helpers for ID & Password hashing (never stores plaintext passwords)

const PBKDF2_ITERATIONS = 100000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function generateSaltHex(byteLength = 16): string {
  const salt = new Uint8Array(byteLength);
  crypto.getRandomValues(salt);
  return bytesToHex(salt);
}

export async function hashPasswordPBKDF2(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBytes = hexToBytes(saltHex);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

export async function verifyPasswordPBKDF2(
  password: string,
  saltHex: string,
  expectedHashHex: string
): Promise<boolean> {
  if (!password || !saltHex || !expectedHashHex) return false;
  const computed = await hashPasswordPBKDF2(password, saltHex);
  if (computed.length !== expectedHashHex.length) return false;

  let diff = 0;
  for (let i = 0; i < computed.length; i += 1) {
    diff |= computed.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return diff === 0;
}
