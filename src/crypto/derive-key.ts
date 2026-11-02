import { INFO } from './constants';

// Derives an AES-256-GCM key from an arbitrary string secret via HKDF-SHA-256.
// HKDF tolerates secrets that aren't uniformly random bytes (e.g. base64 strings
// or passphrases) and makes it easy to rotate to a new key format later.
export async function deriveKey(secret: string): Promise<CryptoKey> {
	const raw = new TextEncoder().encode(secret);
	const keyMaterial = await crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveKey']);
	return crypto.subtle.deriveKey(
		{ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: INFO },
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt'],
	);
}
