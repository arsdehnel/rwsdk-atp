import { buildAtprotoLoopbackClientMetadata, NodeOAuthClient } from '@atproto/oauth-client-node';
import { tokenStore } from '../oauth/oauth-token-store';
import { requestLock } from '../oauth/request-lock';
import { stateStore } from '../oauth/state-store';
import type { OAuthClientEnv } from './types';

export async function getOAuthClient(env: OAuthClientEnv): Promise<NodeOAuthClient> {
	const { ATPROTO_PDS_URL: pdsUrl, ATPROTO_PLC_URL: plcUrl, APP_URL: appUrl } = env;

	return new NodeOAuthClient({
		// Passing a string URL instead of AtprotoHandleResolverNode avoids
		// pulling in undici, which is not available in the workerd runtime.
		// In local dev, point at the local PDS so it can resolve .test handles.
		handleResolver: pdsUrl || 'https://bsky.social',

		// Override the default plc.directory with the local PLC so did:plc:* DIDs
		// issued by the local dev stack resolve correctly instead of 404ing on plc.directory.
		...(plcUrl ? { plcDirectoryUrl: plcUrl } : {}),

		// Allow http:// OAuth metadata and token endpoints. Required when running
		// against a local PDS with PDS_DEV_MODE=true (which serves over plain HTTP).
		...(pdsUrl?.startsWith('http:') ? { allowHttp: true } : {}),

		// In production (APP_URL set), use a discoverable client ID — the client_id
		// IS the URL of this metadata document, which authorization servers fetch to
		// verify our identity. In local dev, use the loopback client (a well-known
		// special case recognized by bsky.social and other AT Protocol PDS instances).
		clientMetadata: appUrl
			? {
					client_id: `${appUrl}/api/oauth/client-metadata.json`,
					scope: env.ATPROTO_OAUTH_SCOPE,
					redirect_uris: [`${appUrl}/api/oauth/callback`],
					response_types: ['code'],
					grant_types: ['authorization_code', 'refresh_token'],
					token_endpoint_auth_method: 'none',
					application_type: 'web',
					dpop_bound_access_tokens: true,
				}
			: buildAtprotoLoopbackClientMetadata({
					scope: env.ATPROTO_OAUTH_SCOPE,
					redirect_uris: ['http://127.0.0.1:5173/api/oauth/callback'],
				}),
		stateStore: stateStore(env.KV_OAUTH_STATE, env.OAUTH_STATE_KV_ENCRYPTION_KEYS),
		sessionStore: tokenStore(env.DO_ATP_AUTH),
		requestLock: requestLock(env.DO_ATP_AUTH),
	});
}
