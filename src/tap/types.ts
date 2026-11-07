import type { RecordEvent } from '@atproto/tap';
import type { Logger } from '../logger';

export type { RecordEvent, TapEvent } from '@atproto/tap';

export type QueueConsumer = (msg: RecordEvent, ctx: { logger: Logger }) => Promise<void>;
export type WorkflowInvoker = (msg: RecordEvent) => Promise<void>;
export type ATPCollection = string;
export type ATPAction = 'create' | 'update' | 'delete';

export type QueueConsumerRegistration = {
	collection: ATPCollection;
	actions: ATPAction[];
	type: 'QUEUE';
	queueConsumer: QueueConsumer;
};

export type WorkflowInvokerRegistration = {
	collection: ATPCollection;
	actions: ATPAction[];
	type: 'WORKFLOW';
	workflowInvoker: WorkflowInvoker;
};

export type TapRegistration = QueueConsumerRegistration | WorkflowInvokerRegistration;
