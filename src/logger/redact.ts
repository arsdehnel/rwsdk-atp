import { CENSOR, REDACTED_PATTERN } from './constants';

export function redact(value: unknown): unknown {
	if (value === null || typeof value !== 'object') return value;
	if (Array.isArray(value)) return value.map(redact);
	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, REDACTED_PATTERN.test(k) ? CENSOR : redact(v)]),
	);
}
