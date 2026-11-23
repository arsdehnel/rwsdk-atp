export type { NodeOAuthClient, OAuthSession } from '@atproto/oauth-client-node';

import type { AtpOAuthDurableObject } from '../oauth/durable-object';

export interface OAuthClientEnv {
	ATPROTO_OAUTH_SCOPE: string;
	ATPROTO_PDS_URL?: string;
	ATPROTO_PLC_URL?: string;
	APP_URL?: string;
	OAUTH_STATE_KV_ENCRYPTION_KEYS: string;
	KV_OAUTH_STATE: KVNamespace;
	DO_ATP_AUTH: DurableObjectNamespace<AtpOAuthDurableObject>;
}

export interface PasswordClientEnv {
	DO_ATP_AUTH: DurableObjectNamespace<AtpOAuthDurableObject>;
	ATP_SERVICE_DID: string;
	ATP_SERVICE_APP_PASSWORD: string;
	ATPROTO_PDS_URL: string;
}
