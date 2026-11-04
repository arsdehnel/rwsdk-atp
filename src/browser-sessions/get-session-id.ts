import { parseCookie } from 'cookie';
import { isValidSessionId } from './is-valid-session-id';
import type { BrowserSessionEnv } from './types';
import { unpackSessionId } from './unpack-session-id';

export async function getSessionId(env: BrowserSessionEnv, request: Request): Promise<string | null> {
	const cookieHeader = request.headers.get('Cookie');
	if (!cookieHeader) {
		return null;
	}
	const existingCookie = parseCookie(cookieHeader);
	const sessionIdCookieKey = env.SESSION_ID_COOKIE_KEY;
	if (!existingCookie[sessionIdCookieKey]) {
		return null;
	}
	const signedSessionId = existingCookie[sessionIdCookieKey];
	if (!(await isValidSessionId(env.BROWSER_SESSION_SIGNING_KEY, signedSessionId))) {
		throw new Error(`Invalid session ID`);
	}
	const { unsignedSessionId } = unpackSessionId(signedSessionId);
	return unsignedSessionId;
}
