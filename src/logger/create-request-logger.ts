import { buildLogger } from './build-logger';
import type { Logger, LogLevel } from './types';

export function createRequestLogger(
	request: Request,
	isDev?: boolean,
	logLevelOverride?: LogLevel,
	taskOverrides?: string | undefined,
): Logger {
	return buildLogger(
		{
			correlationId: request.headers.get('cf-ray') ?? crypto.randomUUID(),
			path: new URL(request.url).pathname,
		},
		isDev,
		logLevelOverride,
		taskOverrides,
	);
}
