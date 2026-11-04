import { createSessionSignature } from './create-session-signature';
import { packSessionId } from './pack-session-id';
import { setSessionCookie } from './set-session-cookie';
import type { BrowserSessionEnv, Session } from './types';

export async function saveSession(
	env: BrowserSessionEnv,
	requestUrl: string,
	unsignedSessionId: string | null,
	headers: Headers,
	sessionData: Partial<Session>,
): Promise<Session> {
	if (!unsignedSessionId) {
		unsignedSessionId = crypto.randomUUID();
	}

	const doStub = env.DO_BROWSER_SESSION.getByName(unsignedSessionId);

	const signature = await createSessionSignature(env.BROWSER_SESSION_SIGNING_KEY, unsignedSessionId);
	const signedSessionId = packSessionId(unsignedSessionId, signature);
	const savedSession = await doStub.saveSession(unsignedSessionId, sessionData);
	setSessionCookie(env.SESSION_ID_COOKIE_KEY, requestUrl, signedSessionId, env.SESSION_TIMEOUT_SECONDS, headers);
	// sessionLifecycleEvent({ sessionId: unsignedSessionId, event: 'UPSERT', userId: sessionData.userId });
	return savedSession;
}
