import { describe, expect, it } from 'vitest';
import { parseTaskOverrides } from '../parse-task-overrides';

describe('parseTaskOverrides', () => {
	it('returns an empty map when given undefined', () => {
		expect(parseTaskOverrides(undefined).size).toBe(0);
	});

	it('returns an empty map for an empty string', () => {
		expect(parseTaskOverrides('').size).toBe(0);
	});

	it('parses a single task:level entry', () => {
		const map = parseTaskOverrides('payments:debug');
		expect(map.get('payments')).toBe('debug');
	});

	it('parses multiple comma-separated entries', () => {
		const map = parseTaskOverrides('payments:debug,auth:warn');
		expect(map.get('payments')).toBe('debug');
		expect(map.get('auth')).toBe('warn');
	});

	it('ignores entries with an unrecognised level', () => {
		const map = parseTaskOverrides('payments:verbose');
		expect(map.has('payments')).toBe(false);
	});

	it('trims whitespace around task and level', () => {
		const map = parseTaskOverrides('payments : debug');
		expect(map.get('payments')).toBe('debug');
	});

	it('accepts all valid log levels', () => {
		const map = parseTaskOverrides('a:debug,b:info,c:warn,d:error');
		expect(map.get('a')).toBe('debug');
		expect(map.get('b')).toBe('info');
		expect(map.get('c')).toBe('warn');
		expect(map.get('d')).toBe('error');
	});

	describe('malformed and partial entries', () => {
		it('ignores an entry with an empty task name', () => {
			expect(parseTaskOverrides(':debug').size).toBe(0);
		});

		it('ignores an entry with an empty level', () => {
			expect(parseTaskOverrides('payments:').size).toBe(0);
		});

		it('ignores an entry with no colon separator at all', () => {
			expect(parseTaskOverrides('payments').size).toBe(0);
		});

		it('ignores empty slots produced by adjacent commas', () => {
			const map = parseTaskOverrides('payments:debug,,auth:warn');
			expect(map.get('payments')).toBe('debug');
			expect(map.get('auth')).toBe('warn');
			expect(map.size).toBe(2);
		});

		it('ignores valid-looking entries mixed with garbage', () => {
			const map = parseTaskOverrides('payments:debug,!!!,auth:warn');
			expect(map.get('payments')).toBe('debug');
			expect(map.get('auth')).toBe('warn');
			expect(map.size).toBe(2);
		});
	});
});
