import { describe, expect, it } from 'vitest';
import { createSessionSignature } from '../create-session-signature';
import { getSessionId } from '../get-session-id';
import { packSessionId } from '../pack-session-id';

const SIGNING_KEY = 'test-signing-key';
const COOKIE_KEY = 'session_id';

const makeEnv = () =>
	({
		BROWSER_SESSION_SIGNING_KEY: SIGNING_KEY,
		SESSION_ID_COOKIE_KEY: COOKIE_KEY,
	}) as any;

const makeRequest = (cookieHeader?: string) =>
	new Request('https://example.com', {
		headers: cookieHeader ? { Cookie: cookieHeader } : {},
	});

async function makeValidCookie(sessionId: string): Promise<string> {
	const sig = await createSessionSignature(SIGNING_KEY, sessionId);
	const packed = packSessionId(sessionId, sig);
	return `${COOKIE_KEY}=${packed}`;
}

describe('getSessionId', () => {
	it('returns null when there is no Cookie header', async () => {
		const result = await getSessionId(makeEnv(), makeRequest());
		expect(result).toBeNull();
	});

	it('returns null when the cookie header contains no matching key', async () => {
		const result = await getSessionId(makeEnv(), makeRequest('other_cookie=some-value'));
		expect(result).toBeNull();
	});

	it('returns null when the cookie header has the key but an empty value', async () => {
		const result = await getSessionId(makeEnv(), makeRequest(`${COOKIE_KEY}=`));
		expect(result).toBeNull();
	});

	it('throws when the session cookie has an invalid signature', async () => {
		// Pack with a different key than what the env uses for verification
		const sig = await createSessionSignature('wrong-key', 'session-abc');
		const packed = packSessionId('session-abc', sig);
		const request = makeRequest(`${COOKIE_KEY}=${packed}`);
		await expect(getSessionId(makeEnv(), request)).rejects.toThrow('Invalid session ID');
	});

	it('returns the unsigned session ID for a valid cookie', async () => {
		const unsignedId = 'session-abc-123';
		const request = makeRequest(await makeValidCookie(unsignedId));
		const result = await getSessionId(makeEnv(), request);
		expect(result).toBe(unsignedId);
	});

	it('returns the correct session ID when multiple cookies are present', async () => {
		const unsignedId = 'session-xyz';
		const validCookiePart = await makeValidCookie(unsignedId);
		const request = makeRequest(`other=value; ${validCookiePart}; another=thing`);
		const result = await getSessionId(makeEnv(), request);
		expect(result).toBe(unsignedId);
	});
});
