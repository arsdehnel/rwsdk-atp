import { describe, expect, it } from 'vitest';
import { decrypt } from '../decrypt';
import { encrypt } from '../encrypt';

describe('encrypt / decrypt', () => {
	it('round-trips plaintext', async () => {
		const secret = 'test-secret-key';
		const plaintext = 'hello world';
		const ciphertext = await encrypt(plaintext, secret);
		expect(await decrypt(ciphertext, secret)).toBe(plaintext);
	});

	it('produces a different ciphertext on each call due to a random IV', async () => {
		const secret = 'test-secret-key';
		const plaintext = 'hello world';
		const ct1 = await encrypt(plaintext, secret);
		const ct2 = await encrypt(plaintext, secret);
		expect(ct1).not.toBe(ct2);
	});

	it('produces base64 output', async () => {
		const ciphertext = await encrypt('test', 'secret');
		expect(() => atob(ciphertext)).not.toThrow();
	});

	it('rejects decryption with the wrong key', async () => {
		const ciphertext = await encrypt('secret message', 'correct-key');
		await expect(decrypt(ciphertext, 'wrong-key')).rejects.toThrow();
	});

	it('round-trips an empty string', async () => {
		const ciphertext = await encrypt('', 'secret');
		expect(await decrypt(ciphertext, 'secret')).toBe('');
	});

	it('round-trips unicode content', async () => {
		const plaintext = '日本語テスト 🎉';
		const ciphertext = await encrypt(plaintext, 'secret');
		expect(await decrypt(ciphertext, 'secret')).toBe(plaintext);
	});
});
