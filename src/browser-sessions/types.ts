import type { BrowserSessionDurableObject } from './durable-object';

export interface BrowserSessionEnv {
	DO_BROWSER_SESSION: DurableObjectNamespace<BrowserSessionDurableObject>;
	BROWSER_SESSION_SIGNING_KEY: string;
	SESSION_ID_COOKIE_KEY: string;
	SESSION_TIMEOUT_SECONDS: number;
}

export type Session = {
	sessionId: string;
	userId?: string | null;
	did: string | null;
	challenge?: string | null;
	lastAccessedAt: number;
};
