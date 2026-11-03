import type { BrowserSessionDurableObject } from './durable-object';
import { getSessionId } from './get-session-id';
import type { Session } from './session';
import { setSessionCookie } from './set-session-cookie';

export async function loadSessionFromRequest(
	sessionDOBinding: DurableObjectNamespace<BrowserSessionDurableObject>,
	browserSessionSigningKey: string,
	sessionIdCookieKey: string,
	request: Request,
	headers: Headers,
): Promise<Session | null> {
	const unsignedSessionId = await getSessionId(browserSessionSigningKey, request);
	if (!unsignedSessionId) {
		return null;
	}
	// sessionLifecycleEvent({ sessionId: unsignedSessionId, event: 'LOAD' });
	const doStub = sessionDOBinding.getByName(unsignedSessionId);
	try {
		return await doStub.getSession();
	} catch {
		setSessionCookie(sessionIdCookieKey, request.url, '', 0, headers);
		// sessionLifecycleEvent({ event: 'RESET' });
		return null;
	}
}
