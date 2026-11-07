import type { ATPAction, ATPCollection, WorkflowInvoker, WorkflowInvokerRegistration } from './types';

export class TapRegistrationWorkflowInvoker {
	private collection: ATPCollection;
	private actions: ATPAction[];
	private workflowInvoker: WorkflowInvoker;

	constructor({ collection, actions, workflowInvoker }: Omit<WorkflowInvokerRegistration, 'type'>) {
		this.collection = collection;
		this.actions = actions;
		this.workflowInvoker = workflowInvoker;
	}

	forRegistration(): WorkflowInvokerRegistration {
		return {
			collection: this.collection,
			actions: this.actions,
			type: 'WORKFLOW',
			workflowInvoker: this.workflowInvoker,
		};
	}
}
