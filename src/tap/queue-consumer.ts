import type { ATPAction, ATPCollection, QueueConsumer, QueueConsumerRegistration } from './types';

export class TapRegistrationQueueConsumer {
	private collection: ATPCollection;
	private actions: ATPAction[];
	private queueConsumer: QueueConsumer;

	constructor({ collection, actions, queueConsumer }: Omit<QueueConsumerRegistration, 'type'>) {
		this.collection = collection;
		this.actions = actions;
		this.queueConsumer = queueConsumer;
	}

	forRegistration(): QueueConsumerRegistration {
		return {
			collection: this.collection,
			actions: this.actions,
			type: 'QUEUE',
			queueConsumer: this.queueConsumer,
		};
	}
}
