/// <reference types="vite/client" />

import type { DurableObject, DurableObjectNamespace } from 'cloudflare:workers';

export interface SessionEnv {
	SESSION_SIGNING_KEY: string;
	SESSION_DURABLE_OBJECT: DurableObjectNamespace<DurableObject>;
	SESSION_ID_COOKIE_KEY: string;
}
