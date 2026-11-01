import type { WorkflowEvent } from 'cloudflare:workers';
import { buildLogger } from './build-logger';
import type { Logger, LogLevel } from './types';

export function createWorkflowLogger(
	event: WorkflowEvent<unknown>,
	isDev?: boolean,
	logLevelOverride?: LogLevel,
	taskOverrides?: string | undefined,
): Logger {
	return buildLogger(
		{
			instanceId: event.instanceId,
			workflowName: event.workflowName,
			triggeredAt: event.timestamp.toISOString(),
		},
		isDev,
		logLevelOverride,
		taskOverrides,
	);
}
