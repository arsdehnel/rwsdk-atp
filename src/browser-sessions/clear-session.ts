import type { BrowserSessionDurableObject } from './durable-object';
import { getSessionId } from './get-session-id';
import { setSessionCookie } from './set-session-cookie';

export async function clear(
	sessionDOBinding: DurableObjectNamespace<BrowserSessionDurableObject>,
	browserSessionSigningKey: string,
	sessionIdCookieKey: string,
	request: Request,
	headers: Headers,
): Promise<void> {
	const unsignedSessionId = await getSessionId(browserSessionSigningKey, request);
	if (!unsignedSessionId) {
		return;
	}
	const sessionDOId = sessionDOBinding.idFromName(unsignedSessionId);
	const doStub = sessionDOBinding.get(sessionDOId);
	// const toBeRevokedSession = await doStub.getSession();
	await doStub.revokeSession();
	setSessionCookie(sessionIdCookieKey, request.url, '', 0, headers);
	// sessionLifecycleEvent({ sessionId: unsignedSessionId, event: 'CLEAR', userId: toBeRevokedSession.userId });
}
