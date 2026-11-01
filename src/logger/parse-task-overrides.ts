import type { LogLevel } from './types';

export function parseTaskOverrides(overrides: string | undefined): Map<string, LogLevel> {
	const map = new Map<string, LogLevel>();
	if (!overrides) return map;
	for (const entry of overrides.split(',')) {
		const [task, level] = entry.split(':').map(s => s.trim());
		if (task && (level === 'debug' || level === 'info' || level === 'warn' || level === 'error')) {
			map.set(task, level);
		}
	}
	return map;
}
