import { IV_BYTES } from './constants';
import { deriveKey } from './derive-key';

export async function decrypt(stored: string, secret: string): Promise<string> {
	const key = await deriveKey(secret);
	const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
	const iv = combined.slice(0, IV_BYTES);
	const ciphertext = combined.slice(IV_BYTES);
	const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
	return new TextDecoder().decode(plaintext);
}
