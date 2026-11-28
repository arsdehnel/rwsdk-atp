# Tap Integration

Tap delivers real-time AT Protocol record events (creates, updates, deletes) to your app as webhooks. `rwsdk-atp` provides a handler and registration system that routes these events to your code — either synchronously in the webhook handler itself, or asynchronously via a Cloudflare Queue.

## Wrangler queue configuration

Events received from Tap are published to a Cloudflare Queue for asynchronous processing. Add the queue binding to your `wrangler.jsonc`:

```jsonc
{
	"queues": {
		"consumers": [
			{
				"queue": "<your-queue-name>",
				"max_batch_size": 10,
				"max_batch_timeout": 5
			}
		],
		"producers": [
			{
				"binding": "QUEUE_TAP_WEBHOOK",
				"queue": "<your-queue-name>"
			}
		]
	}
}
```

**Further reading:**
- [Cloudflare Queues](https://developers.cloudflare.com/queues/)

## Webhook endpoint

Add a route handler that delegates to `tapWebhookHandler`. The handler parses the incoming event, validates it, and routes it to the matching registered consumer or workflow invoker.

```ts
// src/api/webhooks/tap.ts
import { env } from 'cloudflare:workers';
import type { RequestInfo } from 'rwsdk/worker';
import { tapWebhookHandler } from '@arsdehnel/rwsdk-atp/tap';
import tapRegistrations from '@/tap/registrations';

async function post({ ctx, request }: RequestInfo): Promise<Response> {
	return await tapWebhookHandler(request, tapRegistrations, env.QUEUE_TAP_WEBHOOK, ctx.logger);
}

export default { post };
```

Register it in your API routes:

```ts
route('/webhooks/tap', tap),
```

## Tap registrations

Create a `TapRegistrations` instance and register consumers for the collections you care about. The registration specifies which collection and which actions (create, update, delete) to match.

A **queue consumer** (`TapRegistrationQueueConsumer`) receives events via the Cloudflare Queue and processes them asynchronously. A **workflow invoker** (`TapRegistrationWorkflowInvoker`) is called directly in the webhook request handler and must respond quickly.

```ts
// src/tap/registrations.ts
import { TapRegistrations } from '@arsdehnel/rwsdk-atp/tap';
import myConsumer from './my-consumer';

const tapRegistrations = new TapRegistrations();
tapRegistrations.registerQueueConsumer(myConsumer.forRegistration());

export default tapRegistrations;
```

```ts
// src/tap/my-consumer.ts
import { type RecordEvent, TapRegistrationQueueConsumer } from '@arsdehnel/rwsdk-atp/tap';
import type { Logger } from '@arsdehnel/rwsdk-atp/logger';

async function queueConsumer(msg: RecordEvent, ctx: { logger: Logger }): Promise<void> {
	ctx.logger.info(`Processing event: ${msg.collection} ${msg.action} by ${msg.did}`);
	// handle the event...
}

export default new TapRegistrationQueueConsumer({
	collection: 'xyz.statusphere.status',
	actions: ['create', 'update'],
	queueConsumer,
});
```

## Worker queue export

For the queue consumer to receive messages, the worker's default export must include a `queue` handler alongside `fetch`. This is what the Cloudflare runtime calls when it delivers a batch of queue messages to your worker.

```ts
// src/worker.tsx
const app = defineApp([...]);

export default {
	fetch: app.fetch,
	queue: tapRegistrations.workerQueueHelper,
};
```

If your worker handles multiple queues, see [Multiple Queues](./multiple-queues) for how to route batches to different handlers.
