import { getCallerInfo } from './get-caller-info';
import { parseLevel } from './parse-level';
import { parseTaskOverrides } from './parse-task-overrides';
import type { Logger, LogLevel } from './types';
import { writeLog } from './write-log';

export function buildLogger(
	bindings: Record<string, unknown>,
	isDev?: boolean,
	levelOverride?: LogLevel,
	taskOverrides?: string | undefined,
): Logger {
	const overrides = parseTaskOverrides(taskOverrides);
	const level = parseLevel(levelOverride, 'info');
	return {
		debug: (message: string, meta?: Record<string, unknown>) =>
			writeLog('debug', message, level, bindings, meta, isDev ? getCallerInfo() : undefined),
		info: (message: string, meta?: Record<string, unknown>) =>
			writeLog('info', message, level, bindings, meta, isDev ? getCallerInfo() : undefined),
		warn: (message: string, meta?: Record<string, unknown>) =>
			writeLog('warn', message, level, bindings, meta, isDev ? getCallerInfo() : undefined),
		error: (message: string, meta?: Record<string, unknown>) =>
			writeLog('error', message, level, bindings, meta, isDev ? getCallerInfo() : undefined),
		child(childBindings: Record<string, unknown>, levelOverride?: LogLevel): Logger {
			const taskLevel = typeof childBindings.task === 'string' ? overrides.get(childBindings.task) : undefined;
			return buildLogger({ ...bindings, ...childBindings }, isDev, levelOverride ?? taskLevel ?? level, taskOverrides);
		},
	};
}
