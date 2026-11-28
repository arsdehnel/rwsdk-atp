export type { NodeOAuthClient, OAuthSession } from '@atproto/oauth-client-node';

import type { AtpOAuthDurableObject } from '../oauth/durable-object';

export interface OAuthClientEnv {
	ATPROTO_OAUTH_SCOPE: string;
	// The app's public base URL (scheme + host + optional port, no trailing slash).
	// Used as the OAuth client_id base and redirect URI base.
	APP_BASE_URL: string;
	// Set to "true" to use the AT Protocol loopback client instead of a discoverable
	// client. Required for local development against real AT Protocol PDS instances
	// (e.g. bsky.social). Not needed for Docker devnets that run a local PDS.
	ATPROTO_OAUTH_USE_LOOPBACK_OVERRIDE?: string;
	// Override the handle resolver URL. Defaults to https://bsky.social.
	// Set to your local PDS URL (e.g. http://localhost:3000) in Docker devnets
	// so that .test handles resolve correctly.
	ATPROTO_HANDLE_RESOLVE_URL_OVERRIDE?: string;
	// Override the PLC directory URL. Defaults to https://plc.directory.
	// Set to your local PLC URL (e.g. http://localhost:2582) in Docker devnets
	// so that did:plc:* DIDs issued by the local stack resolve correctly.
	ATPROTO_PLC_URL_OVERRIDE?: string;
	OAUTH_STATE_KV_ENCRYPTION_KEYS: string;
	KV_OAUTH_STATE: KVNamespace;
	DO_ATP_AUTH: DurableObjectNamespace<AtpOAuthDurableObject>;
}

export interface PasswordClientEnv {
	DO_ATP_AUTH: DurableObjectNamespace<AtpOAuthDurableObject>;
	ATP_SERVICE_DID: string;
	ATP_SERVICE_APP_PASSWORD: string;
	// Override the PLC directory URL for DID resolution. Defaults to https://plc.directory.
	// Set to your local PLC URL (e.g. http://localhost:2582) in Docker devnets.
	ATPROTO_PLC_URL_OVERRIDE?: string;
}
