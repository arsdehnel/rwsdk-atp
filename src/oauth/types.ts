import type { OAuthTokenDurableObject } from './durable-object';

export interface OAuthTokenEnv {
	OAUTH_TOKEN_KV_ENCRYPTION_KEYS: string;
}

export interface OAuthClientEnv {
	ATPROTO_OAUTH_SCOPE: string;
	ATPROTO_PDS_URL?: string;
	ATPROTO_PLC_URL?: string;
	APP_URL?: string;
	OAUTH_STATE_KV_ENCRYPTION_KEYS: string;
	KV_OAUTH_STATE: KVNamespace;
	DO_OAUTH_TOKEN: DurableObjectNamespace<OAuthTokenDurableObject>;
}
