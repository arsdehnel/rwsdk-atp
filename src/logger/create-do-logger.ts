import { buildLogger } from './build-logger';
import type { Logger, LogLevel } from './types';

export function createDoLogger(
	classContext: Record<string, string | number | boolean>,
	isDev?: boolean,
	logLevelOverride?: LogLevel,
	taskOverrides?: string | undefined,
): Logger {
	return buildLogger(
		{
			...classContext,
		},
		isDev,
		logLevelOverride,
		taskOverrides,
	);
}
