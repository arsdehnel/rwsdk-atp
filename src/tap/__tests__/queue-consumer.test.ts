import { describe, expect, it, vi } from 'vitest';
import { TapRegistrationQueueConsumer } from '../queue-consumer';

describe('TapRegistrationQueueConsumer', () => {
	const queueConsumer = vi.fn();

	it('forRegistration sets type to QUEUE', () => {
		const consumer = new TapRegistrationQueueConsumer({
			collection: 'xyz.statusphere.status',
			actions: ['create'],
			queueConsumer,
		});
		expect(consumer.forRegistration().type).toBe('QUEUE');
	});

	it('forRegistration preserves the configured collection', () => {
		const consumer = new TapRegistrationQueueConsumer({
			collection: 'com.example.post',
			actions: ['create'],
			queueConsumer,
		});
		expect(consumer.forRegistration().collection).toBe('com.example.post');
	});

	it('forRegistration preserves the configured actions', () => {
		const consumer = new TapRegistrationQueueConsumer({
			collection: 'xyz.statusphere.status',
			actions: ['create', 'update'],
			queueConsumer,
		});
		expect(consumer.forRegistration().actions).toEqual(['create', 'update']);
	});

	it('forRegistration preserves the queueConsumer reference', () => {
		const consumer = new TapRegistrationQueueConsumer({
			collection: 'xyz.statusphere.status',
			actions: ['create'],
			queueConsumer,
		});
		expect(consumer.forRegistration().queueConsumer).toBe(queueConsumer);
	});
});
