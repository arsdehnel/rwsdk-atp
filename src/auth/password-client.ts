import { PasswordSession, type SessionData } from '@atproto/lex-password-session';
import type { PasswordClientEnv } from './types';

export async function getPasswordClient(env: PasswordClientEnv): Promise<PasswordSession> {
	const doStub = await env.DO_ATP_AUTH.getByName(env.ATP_SERVICE_DID);

	const onUpdated = (data: SessionData): void => {
		void doStub.setPasswordToken(data as Record<string, unknown>);
	};
	const onDeleted = (): void => {
		void doStub.deletePasswordToken();
	};

	const stored = (await doStub.getPasswordToken()) as SessionData | undefined;
	return stored
		? PasswordSession.resume(stored, { onUpdated, onDeleted })
		: PasswordSession.login({
				service: env.ATPROTO_PDS_URL,
				identifier: env.ATP_SERVICE_DID,
				password: env.ATP_SERVICE_APP_PASSWORD,
				onUpdated,
				onDeleted,
			});
}
