# Middleware

`rwsdk-atp/middleware` provides drop-in middleware functions for common security and request-handling concerns. Add them to your middleware chain in `worker.tsx`.

## Bot protection

`botMiddleware` blocks automated scanners that probe for JavaScript source maps. These requests are characteristic of bots looking for debug artifacts and are never legitimate in production — returning a 405 immediately cuts them off before they hit any real route logic.

```ts
// src/worker.tsx
import { botMiddleware } from '@arsdehnel/rwsdk-atp/middleware';

const app = defineApp([
	botMiddleware,
	loggerMiddleware,
	sessionMiddleware,
	// ...
]);
```

## Security headers

`headersMiddleware` sets a standard set of security response headers on every request: `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a `Content-Security-Policy`.

The CSP is pre-configured for a typical RedwoodSDK app — including nonce-based script execution, Cloudflare Turnstile, Google Fonts, and `unsafe-eval` (required by Vite's dev runtime). The `connect-src` directive automatically expands to allow `localhost:*` in dev so hot-reload websockets and local API calls aren't blocked.

HSTS is only set outside of the dev server since HTTPS isn't available locally.

```ts
// src/worker.tsx
import { headersMiddleware } from '@arsdehnel/rwsdk-atp/middleware';

const app = defineApp([
	botMiddleware,
	headersMiddleware,
	loggerMiddleware,
	sessionMiddleware,
	// ...
]);
```

## CORS

`createCorsMiddleware` returns a middleware function configured with the routes and methods your app needs to allow cross-origin requests on. Only the paths you list will have CORS headers applied — all other paths are unaffected.

Preflight `OPTIONS` requests are handled automatically with a `204` response. For other methods, the CORS headers are appended to the response.

```ts
// src/middleware/cors.ts
import { createCorsMiddleware } from '@arsdehnel/rwsdk-atp/middleware';

export const corsMiddleware = createCorsMiddleware({
	'/api/import': ['POST'],
	'/api/webhooks/tap': ['POST'],
});
```

```ts
// src/worker.tsx
import { corsMiddleware } from '@/middleware/cors';

const app = defineApp([
	botMiddleware,
	corsMiddleware,
	headersMiddleware,
	loggerMiddleware,
	sessionMiddleware,
	// ...
]);
```
