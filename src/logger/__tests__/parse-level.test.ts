import { describe, expect, it } from 'vitest';
import { parseLevel } from '../parse-level';

describe('parseLevel', () => {
	it.each(['debug', 'info', 'warn', 'error'] as const)('returns %s when given the matching string', level => {
		expect(parseLevel(level, 'info')).toBe(level);
	});

	it('returns the fallback for an unrecognised string', () => {
		expect(parseLevel('verbose', 'info')).toBe('info');
	});

	it('returns the fallback when given undefined', () => {
		expect(parseLevel(undefined, 'warn')).toBe('warn');
	});

	it('uses the supplied fallback, not a hardcoded default', () => {
		expect(parseLevel(undefined, 'error')).toBe('error');
	});
});
