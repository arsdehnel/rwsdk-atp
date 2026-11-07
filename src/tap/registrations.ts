import { createQueueLogger } from '../logger/create-queue-logger';
import type {
	ATPAction,
	ATPCollection,
	QueueConsumerRegistration,
	RecordEvent,
	TapRegistration,
	WorkflowInvokerRegistration,
} from './types';

export class TapRegistrations {
	private registrations: TapRegistration[] = [];
	private registeredCollectionActions: Set<string> = new Set();

	registerQueueConsumer(registration: QueueConsumerRegistration): void {
		this.registrations.push(registration);
		registration.actions.forEach(act => {
			this.registeredCollectionActions.add(`${registration.collection}|${act}`);
		});
	}

	registerWorkflowInvoker(registration: WorkflowInvokerRegistration): void {
		this.registrations.push(registration);
		registration.actions.forEach(act => {
			this.registeredCollectionActions.add(`${registration.collection}|${act}`);
		});
	}

	isRegistered(collection: ATPCollection, action: ATPAction): boolean {
		return this.registeredCollectionActions.has(`${collection}|${action}`);
	}

	getQueueConsumers(collection: ATPCollection, action: ATPAction): QueueConsumerRegistration[] {
		return this.registrations.filter(
			r => r.collection === collection && r.actions.includes(action) && r.type === 'QUEUE',
		) as QueueConsumerRegistration[];
	}

	hasQueueConsumers(collection: ATPCollection, action: ATPAction): boolean {
		return this.getQueueConsumers(collection, action).length > 0;
	}

	getWorkflowInvokers(collection: ATPCollection, action: ATPAction): WorkflowInvokerRegistration[] {
		return this.registrations.filter(
			r => r.collection === collection && r.actions.includes(action) && r.type === 'WORKFLOW',
		) as WorkflowInvokerRegistration[];
	}

	// can't do standard method definition here such as this:
	// async workerQueueHelper(batch: MessageBatch<unknown>): Promise<void> {
	// because then when used the `this` references are broken but going with
	// the arrow function we get a this bound to this context
	workerQueueHelper = async (batch: MessageBatch<unknown>): Promise<void> => {
		const batchLogger = createQueueLogger(batch, {}, true);
		batchLogger.info(`Message batch received ${JSON.stringify(batch.messages)}`);
		for (const msg of batch.messages) {
			try {
				batchLogger.info(`Message received`);
				const event = msg.body as RecordEvent;
				batchLogger.info(`Message received for ${event.collection} / ${event.action}`);
				const matchingRegistrations = this.getQueueConsumers(event.collection, event.action);
				batchLogger.info(
					`Message received for ${event.collection} / ${event.action} and found ${matchingRegistrations.length} queue consumers`,
				);
				const msgLogger = batchLogger.child({
					collection: event.collection,
					action: event.action,
					did: event.did,
				});
				try {
					for (const r of matchingRegistrations) {
						await r.queueConsumer(event, { logger: msgLogger });
					}
					msg.ack();
				} catch {
					batchLogger.error('Error processing Tap event', { error: msg.body });
				}
			} catch (err) {
				batchLogger.error(`Error processing batch: ${err}`);
			}
		}
	};
}
