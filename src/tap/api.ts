import type { LexValue } from '@atproto/lex';
import { parseTapEvent, type TapEvent } from '@atproto/tap';
import type { Queue } from '@cloudflare/workers-types';
import type { Logger } from '../logger';
import type { TapRegistrations } from './registrations';

export async function tapWebhookHandler(
	request: Request,
	registrations: InstanceType<typeof TapRegistrations>,
	queueBinding: Queue<unknown>,
	logger: Logger,
): Promise<Response> {
	try {
		let body: unknown;
		try {
			body = await request.json();
		} catch (err) {
			logger.warn(`Could not parse request as JSON: ${err}`);
			return new Response('Bad request', { status: 400 });
		}

		let event: TapEvent;
		try {
			event = parseTapEvent(body as LexValue);
		} catch (err) {
			logger.warn(`Body not parseable as Tap event: ${err}`);
			return new Response('Unrecognized event', { status: 400 });
		}

		if (event.type !== 'record') {
			logger.info(`Event of type ${event.type}, expected 'record' so we are skipping`);
			return new Response('ok');
		}

		if (!registrations.isRegistered(event.collection, event.action)) {
			logger.info(`Event of collection ${event.collection} matched no registrations, skipping`);
			return new Response('ok');
		} else {
			logger.info(`Event of collection ${event.collection} shows as registered, continuing`);
		}

		if (registrations.hasQueueConsumers(event.collection, event.action)) {
			logger.info(`Send the event to the tap webhook queue`);
			queueBinding.send(event);
		} else {
			logger.info(`No queue consumers registered`);
		}

		await Promise.all(
			registrations.getWorkflowInvokers(event.collection, event.action).map(async r => {
				await r.workflowInvoker(event);
			}),
		);

		return new Response('ok');
	} catch (err) {
		logger.error(`Unexpected error in tap webhook handler: ${err}`);
		return new Response('error');
	}
}
