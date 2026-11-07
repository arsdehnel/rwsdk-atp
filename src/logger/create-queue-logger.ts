import type { MessageBatch } from '@cloudflare/workers-types';
import { buildLogger } from './build-logger';
import type { Logger, LogLevel } from './types';

export function createQueueLogger(
	batch: MessageBatch,
	additionalContext: Record<string, string | number | boolean> = {},
	isDev?: boolean,
	logLevelOverride?: LogLevel,
	taskOverrides?: string,
): Logger {
	return buildLogger(
		{
			queue: batch.queue,
			...additionalContext,
		},
		isDev,
		logLevelOverride,
		taskOverrides,
	);
}
