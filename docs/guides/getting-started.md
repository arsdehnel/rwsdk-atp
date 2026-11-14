# Getting Started

This guide walks through integrating `rwsdk-atp` into a RedwoodSDK Cloudflare Workers app to add AT Protocol OAuth authentication and session management.

## Installation

Right now this is only available via Tangled as I'm working out how to get it to an AT Protocol-friendly NPM-compatible registry.

```sh
pnpm add git+https://tangled.org/arsdehnel.com/rwsdk-atp.git
```

## Vite plugin

The `rwsdkAtp()` plugin handles dev-time configuration needed for `rwsdk-atp` to work inside the Vite/Cloudflare dev environment. It must be registered before the Cloudflare and Redwood plugins.

The `host: '127.0.0.1'` binding is required because the AT Protocol OAuth flow redirects back to your app after authorization. The redirect URI registered with the PDS must match the address your dev server is actually listening on — `localhost` and `127.0.0.1` are treated as distinct origins.

```ts
import { cloudflare } from '@cloudflare/vite-plugin';
import { redwood } from 'rwsdk/vite';
import { rwsdkAtp } from 'rwsdk-atp/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: '127.0.0.1',
	},
	plugins: [rwsdkAtp(), cloudflare({ viteEnvironment: { name: 'worker' } }), redwood()],
});
```

## Wrangler configuration

`rwsdk-atp` requires three Cloudflare primitives: two Durable Objects and one KV namespace.

**Durable Objects** store per-user data that needs to be consistent and durable:
- `BrowserSessionDurableObject`: stores browser session data, keyed by session ID
- `OAuthTokenDurableObject`: stores OAuth tokens, keyed by user DID

**KV namespace** (`KV_OAUTH_STATE`) holds short-lived OAuth state during the authorization flow — the PKCE verifier and other parameters that need to survive a redirect round-trip to the PDS.

**Secrets** are encryption keys used to protect stored data at rest:
- `BROWSER_SESSION_SIGNING_KEY`: used to HMAC-sign session cookies so they can't be forged
- `OAUTH_STATE_KV_ENCRYPTION_KEYS`: encrypts OAuth state stored in KV
- `OAUTH_TOKEN_KV_ENCRYPTION_KEYS`: encrypts OAuth tokens stored in the Durable Object

**Vars** configure runtime behavior:
- `ATPROTO_OAUTH_SCOPE`: space-separated OAuth scopes your app requests. `atproto` is the minimum; add lexicon-specific scopes (e.g. `repo:xyz.statusphere.status`) for collections you need write access to.
- `SESSION_ID_COOKIE_KEY`: the cookie name used for the session ID
- `SESSION_TIMEOUT_SECONDS`: how long a session stays valid (1209600 = 14 days)

```jsonc
{
	"compatibility_flags": ["nodejs_compat"],

	"durable_objects": {
		"bindings": [
			{ "name": "DO_BROWSER_SESSION", "class_name": "BrowserSessionDurableObject" },
			{ "name": "DO_OAUTH_TOKEN", "class_name": "OAuthTokenDurableObject" }
		]
	},
	"exports": {
		"BrowserSessionDurableObject": { "type": "durable-object", "storage": "sqlite" },
		"OAuthTokenDurableObject": { "type": "durable-object", "storage": "sqlite" }
	},
	"kv_namespaces": [{ "binding": "KV_OAUTH_STATE", "id": "<your-kv-namespace-id>" }],
	"secrets": {
		"required": ["BROWSER_SESSION_SIGNING_KEY", "OAUTH_STATE_KV_ENCRYPTION_KEYS", "OAUTH_TOKEN_KV_ENCRYPTION_KEYS"]
	},
	"vars": {
		"ATPROTO_OAUTH_SCOPE": "atproto",
		"SESSION_ID_COOKIE_KEY": "<your-app-name>-session-id",
		"SESSION_TIMEOUT_SECONDS": 1209600
	}
}
```

**Further reading:**
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

## Export the Durable Objects

Cloudflare needs to find the Durable Object class definitions to route requests to them. They must be re-exported from your worker entry point — the file declared as `"main"` in `wrangler.jsonc`.

```ts
// src/worker.tsx
export { BrowserSessionDurableObject } from 'rwsdk-atp/browser-sessions';
export { OAuthTokenDurableObject } from 'rwsdk-atp/oauth';
```

## Logger middleware

`ctx.logger` is used throughout `rwsdk-atp` — in session loading, OAuth handlers, and Tap webhook processing. Wire it up early in your middleware chain so it's available everywhere.

`createRequestLogger` builds a structured logger tied to the current request. It uses the Cloudflare `cf-ray` header as a correlation ID when available, falling back to a random UUID, so logs across a request can be traced together. The second argument enables more verbose dev-friendly output.

```ts
// src/middleware/logger.ts
import type { DefaultAppContext, RequestInfo } from 'rwsdk/worker';
import { createRequestLogger } from 'rwsdk-atp/logger';

export default function loggerMiddleware({ ctx, request }: RequestInfo<DefaultAppContext>): void {
	ctx.logger = createRequestLogger(request, import.meta.env.DEV);
}
```

Register it as the first middleware in your app so it's available to everything that follows:

```ts
// src/worker.tsx
const app = defineApp([
	loggerMiddleware,
	sessionMiddleware,
	prefix('/api', apiRoutes),
	render(DefaultDocument, [route('/', Pages__root)]),
]);

export default { fetch: app.fetch };
```

For logger configuration options, child loggers, log level filtering, and guidelines on when to use each level, see the [Logging](./logging) guide.

## Session middleware

The session middleware runs on every request and loads the current browser session from the signed cookie, making it available as `ctx.session` in all downstream handlers and pages. Without this, every handler would need to call `loadSessionFromRequest` manually.

```ts
// src/middleware/session.ts
import { env } from 'cloudflare:workers';
import type { DefaultAppContext, RequestInfo } from 'rwsdk/worker';
import { loadSessionFromRequest } from 'rwsdk-atp/browser-sessions';

export default async function sessionMiddleware({ ctx, request, response }: RequestInfo<DefaultAppContext>): Promise<void> {
	ctx.session = await loadSessionFromRequest(env, request, response.headers);
}
```

This is also a good point to add security-focused middleware to your chain. `rwsdk-atp/middleware` provides drop-in handlers for bot protection, security headers, and CORS — see the [Middleware](./middleware) guide.

## OAuth routes

Three route handlers implement the full AT Protocol OAuth PKCE flow: initiation, callback, and logout. The login route kicks off the flow by getting an authorization URL from the user's PDS; the callback route completes it by exchanging the authorization code for a token and creating a session; logout revokes the token and clears the session.

**Login**: accepts a handle, resolves the user's PDS, and returns an authorization URL to redirect to:

```ts
// src/api/oauth/login.ts
import { env } from 'cloudflare:workers';
import type { RequestInfo } from 'rwsdk/worker';
import { getOAuthClient } from 'rwsdk-atp/oauth';

async function post({ ctx, request }: RequestInfo): Promise<Response> {
	const { handle } = (await request.json()) as { handle?: string };
	if (!handle) {
		return Response.json({ error: 'Handle is required' }, { status: 400 });
	}

	const client = await getOAuthClient(env);
	try {
		const authUrl = await client.authorize(handle, { scope: env.ATPROTO_OAUTH_SCOPE });
		return Response.json({ redirectUrl: authUrl.toString() });
	} catch (err) {
		const message = err instanceof Error ? (err.cause ? err.cause : err.message) : String(err);
		ctx.logger.error(`[oauth-login] authorize failed for "${handle}": ${message}`);
		return Response.json({ error: "Handle not found. Make sure you're using a handle on this PDS." }, { status: 400 });
	}
}

export default { post };
```

**Callback**: receives the authorization code from the PDS, exchanges it for a token, and saves the session:

```ts
// src/api/oauth/callback.ts
import { env } from 'cloudflare:workers';
import type { RequestInfo } from 'rwsdk/worker';
import { saveSession } from 'rwsdk-atp/browser-sessions';
import { getOAuthClient, type OAuthSession } from 'rwsdk-atp/oauth';

async function get({ ctx, request, response }: RequestInfo): Promise<Response> {
	const client = await getOAuthClient(env);
	let session: OAuthSession | undefined;
	try {
		({ session } = await client.callback(new URL(request.url).searchParams));
	} catch {
		ctx.logger.error('OAuth callback failed, redirecting to login to try again');
		response.headers.set('Location', '/api/oauth/login');
		return new Response(null, { status: 302, headers: response.headers });
	}

	await saveSession(env, request.url, null, response.headers, { did: session.did });
	response.headers.set('Location', '/');
	return new Response(null, { status: 302, headers: response.headers });
}

export default { get };
```

**Logout**: revokes the OAuth token at the PDS and clears the local session cookie:

```ts
// src/api/oauth/logout.ts
import { env } from 'cloudflare:workers';
import type { RequestInfo } from 'rwsdk/worker';
import { clearSession, loadSessionFromRequest } from 'rwsdk-atp/browser-sessions';
import { getOAuthClient } from 'rwsdk-atp/oauth';

async function post({ request, response }: RequestInfo): Promise<Response> {
	const session = await loadSessionFromRequest(env, request, response.headers);
	if (session?.did) {
		const client = await getOAuthClient(env);
		await client.revoke(session.did);
	}

	await clearSession(env, request, response.headers);
	response.headers.set('Location', '/');
	return new Response(null, { status: 302, headers: response.headers });
}

export default { post };
```

Wire these up in your API routes:

```ts
// src/api/_routes.ts
import { route } from 'rwsdk/router';
import oauthCallback from './oauth/callback';
import oauthLogin from './oauth/login';
import oauthLogout from './oauth/logout';

export default [route('/oauth/login', oauthLogin), route('/oauth/callback', oauthCallback), route('/oauth/logout', oauthLogout)];
```

**Further reading:**
- [AT Protocol OAuth specification](https://atproto.com/specs/oauth)

## Reading the session in pages

Once session middleware is running, `ctx.session` is available in any page or route handler. It is `null` when no session exists, or an object with a `did` field when the user is authenticated:

```ts
// src/pages/home.tsx
import type { RequestInfo } from 'rwsdk/worker';

export default function Home({ ctx }: RequestInfo) {
	if (ctx.session?.did) {
		return <p>Logged in as {ctx.session.did}</p>;
	}
	return <p>Not logged in</p>;
}
```

## Making authenticated AT Protocol API calls

The session cookie stores only the user's DID — a lightweight identifier. Making actual AT Proto API calls (reading or writing records) requires restoring the full OAuth session, which includes the access token and PDS endpoint. Use `oauthClient.restore(did)` to get an `OAuthSession`, then pass it to `@atproto/lex`'s `Client`:

```ts
import { env } from 'cloudflare:workers';
import { Client } from '@atproto/lex';
import { getOAuthClient } from 'rwsdk-atp/oauth';

const oauthClient = await getOAuthClient(env);
const oauthSession = await oauthClient.restore(did);

const lexClient = new Client(oauthSession);
// lexClient is now authenticated as the user and can make AT Proto API calls
```

`restore()` will throw if the OAuth session has expired or been revoked. Handle that case by revoking the local session and directing the user back to the login flow.

## Next steps

- [Tap Integration](./tap-integration): receive real-time AT Protocol record events via webhooks and Cloudflare Queues
- [Middleware](./middleware): bot protection, security headers, and CORS
- [Logging](./logging): structured loggers for Durable Objects, Queues, and Workflows, and log level guidelines
