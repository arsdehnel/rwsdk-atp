# Multiple Queues

By default the getting started guide wires up the TAP queue handler directly as the worker's `queue` export:

```ts
export default {
	fetch: app.fetch,
	queue: tapRegistrations.workerQueueHelper,
};
```

This works when the TAP webhook queue is the only queue in your worker. If you add additional queues, the Cloudflare runtime routes all queue message batches through the single `queue` export regardless of which queue they came from. You need to dispatch to the right handler based on `batch.queue`, which contains the name of the queue that produced the batch.

## Dispatching by queue name

Replace the direct assignment with a function that checks `batch.queue` and routes accordingly:

```ts
export default {
	fetch: app.fetch,
	async queue(batch: MessageBatch<unknown>) {
		switch (batch.queue) {
			case 'queue-tap-webhook':
				await tapRegistrations.workerQueueHelper(batch);
				break;
			case 'queue-my-other-queue':
				await myOtherQueueHandler(batch);
				break;
		}
	},
};
```

The queue names in the `case` branches must match the `queue` values from your `wrangler.jsonc` producers configuration.

**Further reading:**
- [Cloudflare Queues: Consumer Workers](https://developers.cloudflare.com/queues/reference/how-queues-works/#consumer-workers)
