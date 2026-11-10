import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TapRegistrations } from '../registrations';
import type { RecordEvent } from '../types';

const makeEvent = (overrides: Partial<RecordEvent> = {}): RecordEvent =>
	({
		id: 1,
		type: 'record',
		action: 'create',
		did: 'did:plc:testuser',
		rev: 'abc123',
		collection: 'xyz.statusphere.status',
		rkey: 'self',
		live: false,
		...overrides,
	}) as RecordEvent;

const makeBatch = (events: RecordEvent[]): MessageBatch<unknown> =>
	({
		messages: events.map((body, i) => ({
			body,
			id: String(i),
			timestamp: new Date(),
			attempts: 1,
			ack: vi.fn(),
			retry: vi.fn(),
		})),
		queue: 'test-queue',
		ackAll: vi.fn(),
		retryAll: vi.fn(),
	}) as unknown as MessageBatch<unknown>;

describe('TapRegistrations', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockReturnValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('isRegistered', () => {
		it('returns false for an unregistered collection+action', () => {
			const reg = new TapRegistrations();
			expect(reg.isRegistered('xyz.statusphere.status', 'create')).toBe(false);
		});

		it('returns true after registering a matching collection+action', () => {
			const reg = new TapRegistrations();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: vi.fn(),
			});
			expect(reg.isRegistered('xyz.statusphere.status', 'create')).toBe(true);
		});

		it('returns false for an action not covered by the registration', () => {
			const reg = new TapRegistrations();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: vi.fn(),
			});
			expect(reg.isRegistered('xyz.statusphere.status', 'delete')).toBe(false);
		});

		it('returns false for a different collection', () => {
			const reg = new TapRegistrations();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: vi.fn(),
			});
			expect(reg.isRegistered('com.example.other', 'create')).toBe(false);
		});
	});

	describe('getQueueConsumers', () => {
		it('returns matching consumers', () => {
			const reg = new TapRegistrations();
			const fn = vi.fn();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create', 'update'],
				type: 'QUEUE',
				queueConsumer: fn,
			});
			const consumers = reg.getQueueConsumers('xyz.statusphere.status', 'create');
			expect(consumers).toHaveLength(1);
			expect(consumers[0].queueConsumer).toBe(fn);
		});

		it('returns an empty array when nothing matches', () => {
			const reg = new TapRegistrations();
			expect(reg.getQueueConsumers('xyz.statusphere.status', 'create')).toHaveLength(0);
		});

		it('does not return workflow invoker registrations', () => {
			const reg = new TapRegistrations();
			reg.registerWorkflowInvoker({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'WORKFLOW',
				workflowInvoker: vi.fn(),
			});
			expect(reg.getQueueConsumers('xyz.statusphere.status', 'create')).toHaveLength(0);
		});
	});

	describe('getWorkflowInvokers', () => {
		it('returns matching workflow invokers', () => {
			const reg = new TapRegistrations();
			const fn = vi.fn();
			reg.registerWorkflowInvoker({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'WORKFLOW',
				workflowInvoker: fn,
			});
			const invokers = reg.getWorkflowInvokers('xyz.statusphere.status', 'create');
			expect(invokers).toHaveLength(1);
			expect(invokers[0].workflowInvoker).toBe(fn);
		});

		it('returns an empty array when nothing matches', () => {
			const reg = new TapRegistrations();
			expect(reg.getWorkflowInvokers('xyz.statusphere.status', 'create')).toHaveLength(0);
		});

		it('does not return queue consumer registrations', () => {
			const reg = new TapRegistrations();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: vi.fn(),
			});
			expect(reg.getWorkflowInvokers('xyz.statusphere.status', 'create')).toHaveLength(0);
		});
	});

	describe('hasQueueConsumers', () => {
		it('returns false when no consumers are registered', () => {
			const reg = new TapRegistrations();
			expect(reg.hasQueueConsumers('xyz.statusphere.status', 'create')).toBe(false);
		});

		it('returns true when at least one consumer is registered', () => {
			const reg = new TapRegistrations();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: vi.fn(),
			});
			expect(reg.hasQueueConsumers('xyz.statusphere.status', 'create')).toBe(true);
		});

		it('returns false for a different action than what was registered', () => {
			const reg = new TapRegistrations();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: vi.fn(),
			});
			expect(reg.hasQueueConsumers('xyz.statusphere.status', 'delete')).toBe(false);
		});
	});

	describe('workerQueueHelper', () => {
		it('calls queueConsumer for a matching event', async () => {
			const reg = new TapRegistrations();
			const fn = vi.fn().mockResolvedValue(undefined);
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: fn,
			});

			await reg.workerQueueHelper(makeBatch([makeEvent()]));

			expect(fn).toHaveBeenCalledOnce();
		});

		it('acks the message after the consumer runs', async () => {
			const reg = new TapRegistrations();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: vi.fn().mockResolvedValue(undefined),
			});

			const batch = makeBatch([makeEvent()]);
			await reg.workerQueueHelper(batch);

			expect((batch.messages[0] as any).ack).toHaveBeenCalledOnce();
		});

		it('acks an unmatched message without calling any consumer', async () => {
			const reg = new TapRegistrations();
			const fn = vi.fn();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: fn,
			});

			const batch = makeBatch([makeEvent({ action: 'delete' })]);
			await reg.workerQueueHelper(batch);

			expect(fn).not.toHaveBeenCalled();
			expect((batch.messages[0] as any).ack).toHaveBeenCalledOnce();
		});

		it('passes the event and a logger to the queueConsumer', async () => {
			const reg = new TapRegistrations();
			const fn = vi.fn().mockResolvedValue(undefined);
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: fn,
			});

			const event = makeEvent();
			await reg.workerQueueHelper(makeBatch([event]));

			const [calledEvent, ctx] = fn.mock.calls[0];
			expect(calledEvent).toBe(event);
			expect(ctx).toHaveProperty('logger');
		});

		it('calls all consumers when multiple are registered for the same event', async () => {
			const reg = new TapRegistrations();
			const fn1 = vi.fn().mockResolvedValue(undefined);
			const fn2 = vi.fn().mockResolvedValue(undefined);
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: fn1,
			});
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: fn2,
			});

			await reg.workerQueueHelper(makeBatch([makeEvent()]));

			expect(fn1).toHaveBeenCalledOnce();
			expect(fn2).toHaveBeenCalledOnce();
		});

		it('does not invoke workflow invokers — only queue consumers are dispatched', async () => {
			const reg = new TapRegistrations();
			const queueFn = vi.fn().mockResolvedValue(undefined);
			const workflowFn = vi.fn();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: queueFn,
			});
			reg.registerWorkflowInvoker({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'WORKFLOW',
				workflowInvoker: workflowFn,
			});

			await reg.workerQueueHelper(makeBatch([makeEvent()]));

			expect(queueFn).toHaveBeenCalledOnce();
			expect(workflowFn).not.toHaveBeenCalled();
		});

		it('does not ack the message when a consumer throws', async () => {
			const reg = new TapRegistrations();
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: vi.fn().mockRejectedValue(new Error('consumer blew up')),
			});

			const batch = makeBatch([makeEvent()]);
			await reg.workerQueueHelper(batch);

			expect((batch.messages[0] as any).ack).not.toHaveBeenCalled();
		});

		it('continues processing subsequent messages after a consumer throws', async () => {
			const reg = new TapRegistrations();
			const fn = vi.fn().mockRejectedValueOnce(new Error('first fails')).mockResolvedValue(undefined);
			reg.registerQueueConsumer({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				type: 'QUEUE',
				queueConsumer: fn,
			});

			const batch = makeBatch([makeEvent(), makeEvent()]);
			await reg.workerQueueHelper(batch);

			expect(fn).toHaveBeenCalledTimes(2);
			expect((batch.messages[0] as any).ack).not.toHaveBeenCalled();
			expect((batch.messages[1] as any).ack).toHaveBeenCalledOnce();
		});
	});
});
