import { parseCookie } from 'cookie';
import { isValidSessionId } from './is-valid-session-id';
import { unpackSessionId } from './unpack-session-id';

const sessionIdCookieKey = 'rwsdk-jeopardy-session';

export async function getSessionId(browserSessionSigningKey: string, request: Request): Promise<string | null> {
	const cookieHeader = request.headers.get('Cookie');
	if (!cookieHeader) {
		return null;
	}
	const existingCookie = parseCookie(cookieHeader);
	if (!existingCookie[sessionIdCookieKey]) {
		return null;
	}
	const signedSessionId = existingCookie[sessionIdCookieKey];
	if (!(await isValidSessionId(browserSessionSigningKey, signedSessionId))) {
		throw new Error(`Invalid session ID`);
	}
	const { unsignedSessionId } = unpackSessionId(signedSessionId);
	return unsignedSessionId;
}
