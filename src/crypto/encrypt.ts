import { IV_BYTES } from './constants';
import { deriveKey } from './derive-key';

export async function encrypt(plaintext: string, secret: string): Promise<string> {
	const key = await deriveKey(secret);
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const encoded = new TextEncoder().encode(plaintext);
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

	const combined = new Uint8Array(IV_BYTES + ciphertext.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(ciphertext), IV_BYTES);
	return btoa(Array.from(combined, b => String.fromCharCode(b)).join(''));
}
