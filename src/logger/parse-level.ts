import type { LogLevel } from './types';

export function parseLevel(level: string | undefined, fallback: LogLevel): LogLevel {
	if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') return level;
	return fallback;
}
