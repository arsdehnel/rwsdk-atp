import { createSessionSignature } from './create-session-signature';
import type { BrowserSessionDurableObject } from './durable-object';
import { packSessionId } from './pack-session-id';
import type { Session } from './session';
import { setSessionCookie } from './set-session-cookie';

const sessionDurationInSeconds = 60 * 60 * 24 * 14; // 14 days

export async function saveSession(
	sessionDOBinding: DurableObjectNamespace<BrowserSessionDurableObject>,
	browserSessionSigningKey: string,
	sessionIdCookieKey: string,
	requestUrl: string,
	unsignedSessionId: string | null,
	headers: Headers,
	sessionData: Partial<Session>,
): Promise<Session> {
	if (!unsignedSessionId) {
		unsignedSessionId = crypto.randomUUID();
	}

	const doStub = sessionDOBinding.getByName(unsignedSessionId);

	const signature = await createSessionSignature(browserSessionSigningKey, unsignedSessionId);
	const signedSessionId = packSessionId(unsignedSessionId, signature);
	const savedSession = await doStub.saveSession(unsignedSessionId, sessionData);
	setSessionCookie(sessionIdCookieKey, requestUrl, signedSessionId, sessionDurationInSeconds, headers);
	// sessionLifecycleEvent({ sessionId: unsignedSessionId, event: 'UPSERT', userId: sessionData.userId });
	return savedSession;
}
