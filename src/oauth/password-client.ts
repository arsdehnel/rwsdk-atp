import { PasswordSession, type SessionData } from '@atproto/lex-password-session';
import type { AtpOAuthDurableObject } from './durable-object';

type LoginOptions = {
	service: string;
	identifier: string;
	password: string;
};

export async function getPasswordSession(
	doBinding: DurableObjectNamespace<AtpOAuthDurableObject>,
	did: string,
	loginOptions: LoginOptions,
): Promise<PasswordSession> {
	const doStub = await doBinding.getByName(did);

	const onUpdated = (data: SessionData): void => {
		void doStub.setPasswordToken(data as Record<string, unknown>);
	};
	const onDeleted = (): void => {
		void doStub.deletePasswordToken();
	};

	const stored = (await doStub.getPasswordToken()) as SessionData | undefined;
	return stored
		? PasswordSession.resume(stored, { onUpdated, onDeleted })
		: PasswordSession.login({ ...loginOptions, onUpdated, onDeleted });
}
