import { getSessionId } from './get-session-id';
import { setSessionCookie } from './set-session-cookie';
import type { BrowserSessionEnv, Session } from './types';

export async function loadSessionFromRequest(
	env: BrowserSessionEnv,
	request: Request,
	headers: Headers,
): Promise<Session | null> {
	const unsignedSessionId = await getSessionId(env, request);
	if (!unsignedSessionId) {
		return null;
	}
	// sessionLifecycleEvent({ sessionId: unsignedSessionId, event: 'LOAD' });
	const doStub = env.DO_BROWSER_SESSION.getByName(unsignedSessionId);
	try {
		return await doStub.getSession();
	} catch {
		setSessionCookie(env.SESSION_ID_COOKIE_KEY, request.url, '', 0, headers);
		// sessionLifecycleEvent({ event: 'RESET' });
		return null;
	}
}
