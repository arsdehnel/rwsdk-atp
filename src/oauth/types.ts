export type { NodeOAuthClient, OAuthSession } from '@atproto/oauth-client-node';

export interface OAuthTokenEnv {
	OAUTH_TOKEN_KV_ENCRYPTION_KEYS: string;
}
