import { describe, expect, it } from 'vitest';
import { redact } from '../redact';

describe('redact', () => {
	it('passes through primitive values unchanged', () => {
		expect(redact('hello')).toBe('hello');
		expect(redact(42)).toBe(42);
		expect(redact(true)).toBe(true);
		expect(redact(null)).toBe(null);
	});

	it('censors keys matching "password"', () => {
		expect(redact({ password: 'secret' })).toEqual({ password: '[Redacted]' });
	});

	it('censors keys matching "secret"', () => {
		expect(redact({ clientSecret: 'abc' })).toEqual({ clientSecret: '[Redacted]' });
	});

	it('censors keys matching "token"', () => {
		expect(redact({ accessToken: 'abc' })).toEqual({ accessToken: '[Redacted]' });
	});

	it('censors keys matching "key"', () => {
		expect(redact({ apiKey: 'abc' })).toEqual({ apiKey: '[Redacted]' });
	});

	it('is case-insensitive for the pattern', () => {
		expect(redact({ Password: 'secret' })).toEqual({ Password: '[Redacted]' });
	});

	it('preserves non-sensitive keys alongside censored ones', () => {
		expect(redact({ password: 'secret', name: 'alice' })).toEqual({
			password: '[Redacted]',
			name: 'alice',
		});
	});

	it('recursively redacts nested objects', () => {
		expect(redact({ user: { password: 'secret', name: 'alice' } })).toEqual({
			user: { password: '[Redacted]', name: 'alice' },
		});
	});

	it('recursively redacts objects within arrays', () => {
		expect(redact([{ password: 'secret' }])).toEqual([{ password: '[Redacted]' }]);
	});

	it('leaves a plain array of primitives unchanged', () => {
		expect(redact([1, 2, 3])).toEqual([1, 2, 3]);
	});

	it('passes undefined through unchanged', () => {
		expect(redact(undefined)).toBeUndefined();
	});
});
