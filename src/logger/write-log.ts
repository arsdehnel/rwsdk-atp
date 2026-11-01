import { Chalk } from 'chalk';
import { makeTaggedTemplate } from 'chalk-template';
import { CENSOR, LEVEL_ORDER, REDACTED_PATTERN } from './constants';
import { redact } from './redact';
import { serializeError } from './seriialize-error';
import type { LogLevel } from './types';

// chalk cannot detect color support inside the Worker runtime (no process.stdout),
// so we force level 1 (16-color ANSI) rather than letting it default to 0 (no color).
const chalk = makeTaggedTemplate(new Chalk({ level: 1 }));

export function writeLog(
	level: LogLevel,
	message: string,
	minLevel: LogLevel,
	bindings: Record<string, unknown>,
	meta: Record<string, unknown> | undefined,
	caller?: string,
): void {
	if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
	const serializedMeta = meta
		? Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, v instanceof Error ? serializeError(v) : v]))
		: undefined;
	const entry = { level, message, timestamp: new Date().toISOString(), ...bindings, ...serializedMeta };
	if (caller) {
		const { level, message, timestamp, ...rest } = entry;
		const loc = caller ? ` [${caller}]` : '';
		if (level.toUpperCase() === 'WARN') {
			// biome-ignore lint/suspicious/noConsole: intentional single console.log point for the logger
			console.log(chalk`{bold ${timestamp}} {yellow ${level.toUpperCase()}}${loc} {white ${message}}`);
		} else if (level.toUpperCase() === 'ERROR') {
			// biome-ignore lint/suspicious/noConsole: intentional single console.log point for the logger
			console.log(chalk`{bold ${timestamp}} {red ${level.toUpperCase()}}${loc} {white ${message}}`);
		} else {
			// biome-ignore lint/suspicious/noConsole: intentional single console.log point for the logger
			console.log(chalk`{bold ${timestamp}} {white ${level.toUpperCase()}}${loc} {white ${message}}`);
		}

		Object.entries(rest).forEach(([key, value]) => {
			if (REDACTED_PATTERN.test(key)) {
				// biome-ignore lint/suspicious/noConsole: structured log output — intentional single console.log point for the logger
				console.log(chalk`  {cyan ${key}}: {red ${CENSOR}}`);
			} else {
				if (typeof value === 'object') {
					// biome-ignore lint/suspicious/noConsole: structured log output — intentional single console.log point for the logger
					console.log(chalk`  {cyan ${key}}: {white ${JSON.stringify(value, null, 4)}}`);
				} else {
					// biome-ignore lint/suspicious/noConsole: structured log output — intentional single console.log point for the logger
					console.log(chalk`  {cyan ${key}}: {white ${JSON.stringify(value)}}`);
				}
			}
		});
	} else {
		// biome-ignore lint/suspicious/noConsole: structured log output — intentional single console.log point for the logger
		console.log(JSON.stringify(redact(entry)));
	}
}
