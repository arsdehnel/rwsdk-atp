import { getSessionId } from './get-session-id';
import { setSessionCookie } from './set-session-cookie';
import type { BrowserSessionEnv } from './types';

export async function clearSession(env: BrowserSessionEnv, request: Request, headers: Headers): Promise<void> {
	const unsignedSessionId = await getSessionId(env, request);
	if (!unsignedSessionId) {
		return;
	}
	const doStub = env.DO_BROWSER_SESSION.getByName(unsignedSessionId);
	// const toBeRevokedSession = await doStub.getSession();
	await doStub.revokeSession();
	setSessionCookie(env.SESSION_ID_COOKIE_KEY, request.url, '', 0, headers);
	// sessionLifecycleEvent({ sessionId: unsignedSessionId, event: 'CLEAR', userId: toBeRevokedSession.userId });
}
