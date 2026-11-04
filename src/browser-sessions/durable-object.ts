import { DurableObject } from 'cloudflare:workers';
import type { BrowserSessionEnv, Session } from './types';

export class BrowserSessionDurableObject extends DurableObject {
	private session: Session | undefined = undefined;
	constructor(state: DurableObjectState, env: Cloudflare.Env) {
		super(state, env);
		this.session = undefined;
	}

	private get typedEnv(): BrowserSessionEnv {
		return this.env as unknown as BrowserSessionEnv;
	}

	// seems a little silly but this makes testing much easier
	protected now(): number {
		return Date.now();
	}

	async getSession(): Promise<Session> {
		if (this.session) {
			// Update lastAccessedAt even for cached sessions
			this.session.lastAccessedAt = this.now();
			await this.ctx.storage.put<Session>('session', this.session);
			return this.session;
		}

		const session = await this.ctx.storage.get<Session>('session');

		if (!session) {
			// sessionLifecycleEvent({ event: 'INVALID' });
			throw new Error(`Invalid session`);
		}

		if (session.lastAccessedAt + this.typedEnv.SESSION_TIMEOUT_SECONDS * 1000 < this.now()) {
			// const revokedSession = await this.revokeSession();
			// sessionLifecycleEvent({ sessionId: revokedSession?.sessionId, event: 'EXPIRED', userId: revokedSession?.userId });
			throw new Error(`Session expired`);
		}

		// Update lastAccessedAt on read
		session.lastAccessedAt = this.now();
		await this.ctx.storage.put<Session>('session', session);
		this.session = session;
		return session;
	}

	async saveSession(unsignedSessionId: string, sessionData: Partial<Session>): Promise<Session> {
		const now = this.now();
		const updatedSession: Session = {
			sessionId: unsignedSessionId,
			did: null,
			...sessionData,
			lastAccessedAt: now,
		};
		await this.ctx.storage.put<Session>('session', updatedSession);
		this.session = updatedSession;
		return updatedSession;
	}

	async revokeSession(): Promise<Session | undefined> {
		const toBeRevokedSession = await this.ctx.storage.get<Session>('session');
		await this.ctx.storage.delete('session');
		this.session = undefined;
		return toBeRevokedSession;
	}
}
