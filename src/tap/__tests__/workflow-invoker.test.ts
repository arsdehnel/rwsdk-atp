import { describe, expect, it, vi } from 'vitest';
import { TapRegistrationWorkflowInvoker } from '../workflow-invoker';

describe('TapRegistrationWorkflowInvoker', () => {
	describe('forRegistration', () => {
		it('sets type to WORKFLOW', () => {
			const invoker = new TapRegistrationWorkflowInvoker({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				workflowInvoker: vi.fn(),
			});
			expect(invoker.forRegistration().type).toBe('WORKFLOW');
		});

		it('preserves the configured collection', () => {
			const invoker = new TapRegistrationWorkflowInvoker({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				workflowInvoker: vi.fn(),
			});
			expect(invoker.forRegistration().collection).toBe('xyz.statusphere.status');
		});

		it('preserves the configured actions', () => {
			const invoker = new TapRegistrationWorkflowInvoker({
				collection: 'xyz.statusphere.status',
				actions: ['create', 'update'],
				workflowInvoker: vi.fn(),
			});
			expect(invoker.forRegistration().actions).toEqual(['create', 'update']);
		});

		it('preserves the workflowInvoker reference', () => {
			const fn = vi.fn();
			const invoker = new TapRegistrationWorkflowInvoker({
				collection: 'xyz.statusphere.status',
				actions: ['create'],
				workflowInvoker: fn,
			});
			expect(invoker.forRegistration().workflowInvoker).toBe(fn);
		});
	});
});
