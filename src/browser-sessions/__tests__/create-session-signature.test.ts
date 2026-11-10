import { describe, expect, it } from 'vitest';
import { createSessionSignature } from '../create-session-signature';

describe('createSessionSignature', () => {
	it('produces a hex string', async () => {
		const sig = await createSessionSignature('signing-key', 'session-id');
		expect(sig).toMatch(/^[0-9a-f]+$/);
	});

	it('is deterministic for the same key and session ID', async () => {
		const key = 'signing-key';
		const id = 'session-id';
		expect(await createSessionSignature(key, id)).toBe(await createSessionSignature(key, id));
	});

	it('produces different signatures for different session IDs', async () => {
		const key = 'signing-key';
		const sig1 = await createSessionSignature(key, 'session-1');
		const sig2 = await createSessionSignature(key, 'session-2');
		expect(sig1).not.toBe(sig2);
	});

	it('produces different signatures for different signing keys', async () => {
		const id = 'session-id';
		const sig1 = await createSessionSignature('key-a', id);
		const sig2 = await createSessionSignature('key-b', id);
		expect(sig1).not.toBe(sig2);
	});

	it('produces a valid hex signature for an empty session ID', async () => {
		const sig = await createSessionSignature('signing-key', '');
		expect(sig).toMatch(/^[0-9a-f]+$/);
	});
});
