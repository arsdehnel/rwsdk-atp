import { afterEach, describe, expect, it, vi } from 'vitest';
import { TapRegistrations } from '../registrations';
import type { RecordEvent } from '../types';

vi.mock('@atproto/tap', () => ({
	parseTapEvent: vi.fn(),
}));

import { parseTapEvent } from '@atproto/tap';
import { tapWebhookHandler } from '../api';

const makeRecordEvent = (overrides: Partial<RecordEvent> = {}): RecordEvent =>
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

const makeLogger = () => ({
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	child: vi.fn(),
});

const makeQueue = () => ({ send: vi.fn() }) as any;

const makeJsonRequest = (body: unknown) =>
	new Request('https://example.com/tap', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});

const makeBadRequest = () =>
	new Request('https://example.com/tap', {
		method: 'POST',
		body: 'not json {{{',
	});

afterEach(() => {
	vi.mocked(parseTapEvent).mockReset();
});

describe('tapWebhookHandler', () => {
	it('returns 400 when the request body is not valid JSON', async () => {
		const reg = new TapRegistrations();
		const response = await tapWebhookHandler(makeBadRequest(), reg, makeQueue(), makeLogger());
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Bad request');
	});

	it('returns 400 when the body cannot be parsed as a tap event', async () => {
		vi.mocked(parseTapEvent).mockImplementation(() => {
			throw new Error('not a tap event');
		});
		const reg = new TapRegistrations();
		const response = await tapWebhookHandler(makeJsonRequest({ type: 'unknown' }), reg, makeQueue(), makeLogger());
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Unrecognized event');
	});

	it('returns ok for a non-record event type', async () => {
		vi.mocked(parseTapEvent).mockReturnValue({ type: 'identity' } as any);
		const reg = new TapRegistrations();
		const response = await tapWebhookHandler(makeJsonRequest({ type: 'identity' }), reg, makeQueue(), makeLogger());
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('ok');
	});

	it('returns ok when the collection matches no registrations', async () => {
		vi.mocked(parseTapEvent).mockReturnValue(makeRecordEvent());
		const reg = new TapRegistrations();
		const queue = makeQueue();
		const response = await tapWebhookHandler(makeJsonRequest({}), reg, queue, makeLogger());
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('ok');
		expect(queue.send).not.toHaveBeenCalled();
	});

	it('sends to the queue when a queue consumer is registered', async () => {
		const event = makeRecordEvent();
		vi.mocked(parseTapEvent).mockReturnValue(event);
		const reg = new TapRegistrations();
		reg.registerQueueConsumer({
			collection: 'xyz.statusphere.status',
			actions: ['create'],
			type: 'QUEUE',
			queueConsumer: vi.fn(),
		});
		const queue = makeQueue();
		await tapWebhookHandler(makeJsonRequest({}), reg, queue, makeLogger());
		expect(queue.send).toHaveBeenCalledWith(event);
	});

	it('does not send to the queue when only a workflow invoker is registered', async () => {
		const event = makeRecordEvent();
		vi.mocked(parseTapEvent).mockReturnValue(event);
		const reg = new TapRegistrations();
		reg.registerWorkflowInvoker({
			collection: 'xyz.statusphere.status',
			actions: ['create'],
			type: 'WORKFLOW',
			workflowInvoker: vi.fn().mockResolvedValue(undefined),
		});
		const queue = makeQueue();
		await tapWebhookHandler(makeJsonRequest({}), reg, queue, makeLogger());
		expect(queue.send).not.toHaveBeenCalled();
	});

	it('invokes workflow invokers directly', async () => {
		const event = makeRecordEvent();
		vi.mocked(parseTapEvent).mockReturnValue(event);
		const workflowFn = vi.fn().mockResolvedValue(undefined);
		const reg = new TapRegistrations();
		reg.registerWorkflowInvoker({
			collection: 'xyz.statusphere.status',
			actions: ['create'],
			type: 'WORKFLOW',
			workflowInvoker: workflowFn,
		});
		await tapWebhookHandler(makeJsonRequest({}), reg, makeQueue(), makeLogger());
		expect(workflowFn).toHaveBeenCalledWith(event);
	});

	it('invokes all registered workflow invokers', async () => {
		const event = makeRecordEvent();
		vi.mocked(parseTapEvent).mockReturnValue(event);
		const fn1 = vi.fn().mockResolvedValue(undefined);
		const fn2 = vi.fn().mockResolvedValue(undefined);
		const reg = new TapRegistrations();
		reg.registerWorkflowInvoker({
			collection: 'xyz.statusphere.status',
			actions: ['create'],
			type: 'WORKFLOW',
			workflowInvoker: fn1,
		});
		reg.registerWorkflowInvoker({
			collection: 'xyz.statusphere.status',
			actions: ['create'],
			type: 'WORKFLOW',
			workflowInvoker: fn2,
		});
		await tapWebhookHandler(makeJsonRequest({}), reg, makeQueue(), makeLogger());
		expect(fn1).toHaveBeenCalledOnce();
		expect(fn2).toHaveBeenCalledOnce();
	});

	it('returns "error" when a workflow invoker throws', async () => {
		vi.mocked(parseTapEvent).mockReturnValue(makeRecordEvent());
		const reg = new TapRegistrations();
		reg.registerWorkflowInvoker({
			collection: 'xyz.statusphere.status',
			actions: ['create'],
			type: 'WORKFLOW',
			workflowInvoker: vi.fn().mockRejectedValue(new Error('invoker blew up')),
		});
		const response = await tapWebhookHandler(makeJsonRequest({}), reg, makeQueue(), makeLogger());
		expect(await response.text()).toBe('error');
	});

	it('returns ok and sends to queue when both queue consumer and workflow invoker are registered', async () => {
		const event = makeRecordEvent();
		vi.mocked(parseTapEvent).mockReturnValue(event);
		const queueFn = vi.fn();
		const workflowFn = vi.fn().mockResolvedValue(undefined);
		const reg = new TapRegistrations();
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
		const queue = makeQueue();
		const response = await tapWebhookHandler(makeJsonRequest({}), reg, queue, makeLogger());
		expect(response.status).toBe(200);
		expect(queue.send).toHaveBeenCalledWith(event);
		expect(workflowFn).toHaveBeenCalledWith(event);
	});
});
