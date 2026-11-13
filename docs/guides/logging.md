# Logging

`rwsdk-atp/logger` provides structured loggers for each Cloudflare runtime context — HTTP requests, Durable Objects, Queues, and Workflows. All loggers share the same `Logger` interface and produce JSON output in production, with colored human-readable output in dev.

## Factory functions

Each factory creates a logger pre-populated with context fields appropriate for where it's running. These fields are included automatically on every log entry so you can correlate logs later.

### `createRequestLogger`

For HTTP request handlers. Uses the Cloudflare `cf-ray` header as the correlation ID when available, falling back to a random UUID.

```ts
// src/middleware/logger.ts
import type { DefaultAppContext, RequestInfo } from 'rwsdk/worker';
import { createRequestLogger } from 'rwsdk-atp/logger';

export default function loggerMiddleware({ ctx, request }: RequestInfo<DefaultAppContext>): void {
	ctx.logger = createRequestLogger(request, import.meta.env.DEV);
}
```

Wire it up as the first middleware so it's available to everything that follows:

```ts
// src/worker.tsx
const app = defineApp([
	loggerMiddleware,
	sessionMiddleware,
	prefix('/api', apiRoutes),
	render(DefaultDocument, [route('/', Pages__root)]),
]);
```

### `createQueueLogger`

For queue consumers. Includes the queue name in every entry.

```ts
// src/tap/my-consumer.ts
import type { MessageBatch } from '@cloudflare/workers-types';
import { createQueueLogger } from 'rwsdk-atp/logger';

export default {
	async queue(batch: MessageBatch, env: Env): Promise<void> {
		const logger = createQueueLogger(batch, {}, import.meta.env.DEV);
		// logger.queue is set automatically from batch.queue
	},
};
```

When using the Tap integration, `ctx.logger` is passed through to queue consumers — you do not need to create one manually there.

### `createWorkflowLogger`

For Cloudflare Workflows. Includes `instanceId`, `workflowName`, and `triggeredAt` in every entry.

```ts
// src/workflows/my-workflow.ts
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { createWorkflowLogger } from 'rwsdk-atp/logger';

export class MyWorkflow {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<void> {
		const logger = createWorkflowLogger(event, {}, import.meta.env.DEV);
	}
}
```

### `createDoLogger`

For Durable Objects. Takes a context object whose fields are included in every entry — typically the DO class name and any instance identifier.

```ts
import { createDoLogger } from 'rwsdk-atp/logger';

export class MyDurableObject {
	private logger = createDoLogger({ do: 'MyDurableObject' }, import.meta.env.DEV);
}
```

### `createNoopLogger`

Drops all log entries silently. Useful in tests when you don't want log output but code expects a `Logger`.

```ts
import { createNoopLogger } from 'rwsdk-atp/logger';

const logger = createNoopLogger();
```

## Child loggers

Call `.child()` to create a derived logger that inherits all parent bindings and adds new ones. Use this to attach user or request-scoped context once it becomes available.

```ts
ctx.logger = ctx.logger.child({ userId: user.id });
```

Every log entry after this point will include `userId`. Child loggers can be chained — each call merges new bindings on top.

An optional second argument overrides the minimum log level for the child:

```ts
const verboseLogger = ctx.logger.child({ task: 'import' }, 'debug');
```

## Level filtering

All loggers default to `info` level — `debug` entries are silently dropped unless you override the level. Pass a `LogLevel` as the fourth argument to any factory, or use an environment variable to control it at runtime:

```ts
createRequestLogger(request, import.meta.env.DEV, import.meta.env.LOG_LEVEL as LogLevel);
```

### Per-task overrides

The `taskOverrides` parameter lets you raise the log level for specific tasks without changing the global level. It takes a comma-separated `task:level` string, typically sourced from a wrangler var:

```jsonc
// wrangler.jsonc
{
	"vars": {
		"LOG_TASK_OVERRIDES": "import:debug,webhook:debug"
	}
}
```

```ts
createRequestLogger(request, import.meta.env.DEV, undefined, import.meta.env.LOG_TASK_OVERRIDES);
```

Then in code, name a child logger with a `task` binding to activate the override:

```ts
const importLogger = ctx.logger.child({ task: 'import' });
importLogger.debug('Starting import'); // emitted if 'import:debug' is in overrides
```

## Sensitive field redaction

Any meta key matching `password`, `secret`, `token`, or `key` (case-insensitive) is automatically replaced with `[Redacted]` in log output. Pass sensitive values in the meta object rather than interpolating them into the message string.

```ts
// Safe — apiKey is redacted automatically
logger.info('API key created', { apiKey: key });

// Unsafe — apiKey appears in the message string
logger.info(`API key created: ${key}`);
```

## Dev output

When `isDev` is `true`, the logger produces colored, human-readable output with the call site location. In production, all output is newline-delimited JSON suitable for Cloudflare's log aggregation.

## Log level guidelines

Choosing the right level keeps your logs useful — over-warning dilutes the signal, under-logging makes incidents hard to diagnose.

| Level   | Use when                                                                                          | Example                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `error` | The system failed to do what it was supposed to do. You need to investigate.                      | DB query threw, an unhandled exception was caught, a 5xx response went out              |
| `warn`  | Something unexpected happened outside the system, but we handled it. Worth noticing if it recurs. | Malformed bearer token, revoked API key used, external service returned unexpected data |
| `info`  | A meaningful milestone on the happy path.                                                         | User authenticated, record created, job completed                                       |
| `debug` | Detail useful when actively diagnosing a problem. Too noisy for normal production use.            | Input values, intermediate state, branch taken                                          |

**Practical test for warn vs info**: if you saw this event once in an otherwise healthy system, would you want to investigate? If yes — warn. If you'd nod and move on — info.

**Tiebreaker**: when in doubt, use `info`. Warn should feel like a yellow sticky note — not urgent, but deliberately placed. If warn is everywhere, it stops meaning anything.

The boundary between warn and info is sometimes genuinely ambiguous at the call site. A single expired OAuth session is routine (info); ten in a minute from the same IP might be suspicious (warn). When you can't know which case you're in, default to info and rely on rate-based alerting to catch patterns — that's a job for metrics, not individual log levels.
