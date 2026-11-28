import { buildAtprotoLoopbackClientMetadata, NodeOAuthClient } from '@atproto/oauth-client-node';
import { tokenStore } from '../oauth/oauth-token-store';
import { requestLock } from '../oauth/request-lock';
import { stateStore } from '../oauth/state-store';
import type { OAuthClientEnv } from './types';

export async function getOAuthClient(env: OAuthClientEnv): Promise<NodeOAuthClient> {
	const {
		APP_BASE_URL: appBaseUrl,
		ATPROTO_OAUTH_USE_LOOPBACK_OVERRIDE: useLoopback,
		ATPROTO_HANDLE_RESOLVE_URL_OVERRIDE: handleResolveUrl,
		ATPROTO_PLC_URL_OVERRIDE: plcUrl,
	} = env;

	return new NodeOAuthClient({
		// Passing a string URL instead of AtprotoHandleResolverNode avoids
		// pulling in undici, which is not available in the workerd runtime.
		// In Docker devnets, point at the local PDS so it can resolve .test handles.
		handleResolver: handleResolveUrl || 'https://bsky.social',

		// Override the default plc.directory with the local PLC so did:plc:* DIDs
		// issued by the local dev stack resolve correctly instead of 404ing on plc.directory.
		...(plcUrl ? { plcDirectoryUrl: plcUrl } : {}),

		// Allow http:// OAuth metadata and token endpoints. Required when running
		// against a local PDS with PDS_DEV_MODE=true (which serves over plain HTTP).
		...(handleResolveUrl?.startsWith('http:') ? { allowHttp: true } : {}),

		// Use the loopback client for local dev against real AT Protocol PDS instances.
		// Use a discoverable client (identified by client_id URL) for production.
		clientMetadata:
			useLoopback === 'true'
				? buildAtprotoLoopbackClientMetadata({
						scope: env.ATPROTO_OAUTH_SCOPE,
						redirect_uris: [`${appBaseUrl}/api/oauth/callback`],
					})
				: {
						client_id: `${appBaseUrl}/api/oauth/client-metadata.json`,
						scope: env.ATPROTO_OAUTH_SCOPE,
						redirect_uris: [`${appBaseUrl}/api/oauth/callback`],
						response_types: ['code'],
						grant_types: ['authorization_code', 'refresh_token'],
						token_endpoint_auth_method: 'none',
						application_type: 'web',
						dpop_bound_access_tokens: true,
					},
		stateStore: stateStore(env.KV_OAUTH_STATE, env.OAUTH_STATE_KV_ENCRYPTION_KEYS),
		sessionStore: tokenStore(env.DO_ATP_AUTH),
		requestLock: requestLock(env.DO_ATP_AUTH),
	});
}
