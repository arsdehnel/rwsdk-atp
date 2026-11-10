import { describe, expect, it } from 'vitest';
import { createSessionSignature } from '../create-session-signature';
import { isValidSessionId } from '../is-valid-session-id';
import { packSessionId } from '../pack-session-id';

const SIGNING_KEY = 'test-signing-key';

async function makeValidSessionId(unsignedId: string): Promise<string> {
	const signature = await createSessionSignature(SIGNING_KEY, unsignedId);
	return packSessionId(unsignedId, signature);
}

describe('isValidSessionId', () => {
	it('returns true for a correctly signed session ID', async () => {
		const sessionId = await makeValidSessionId('session-abc');
		expect(await isValidSessionId(SIGNING_KEY, sessionId)).toBe(true);
	});

	it('returns false when verified with the wrong key', async () => {
		const sessionId = await makeValidSessionId('session-abc');
		expect(await isValidSessionId('wrong-key', sessionId)).toBe(false);
	});

	it('returns false for a tampered session ID', async () => {
		const sessionId = await makeValidSessionId('session-abc');
		const tampered = `${sessionId.slice(0, -4)}xxxx`;
		expect(await isValidSessionId(SIGNING_KEY, tampered)).toBe(false);
	});

	it('returns false for an empty string', async () => {
		expect(await isValidSessionId(SIGNING_KEY, '')).toBe(false);
	});

	it('returns false for a plain (non-base64) string', async () => {
		expect(await isValidSessionId(SIGNING_KEY, 'not-valid')).toBe(false);
	});
});
