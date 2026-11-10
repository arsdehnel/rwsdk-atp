import { describe, expect, it } from 'vitest';
import { parseKeyRing } from '../parse-key-ring';

describe('parseKeyRing', () => {
	it('throws when given undefined', () => {
		expect(() => parseKeyRing(undefined)).toThrow('Encryption key ring secret is not configured');
	});

	it('throws when the JSON is not an array', () => {
		expect(() => parseKeyRing(JSON.stringify({ key: 'value' }))).toThrow('Encryption key ring must be a non-empty JSON array');
	});

	it('throws when the array is empty', () => {
		expect(() => parseKeyRing(JSON.stringify([]))).toThrow('Encryption key ring must be a non-empty JSON array');
	});

	it('returns the parsed array of keys', () => {
		const keys = ['key-one', 'key-two'];
		expect(parseKeyRing(JSON.stringify(keys))).toEqual(keys);
	});

	it('returns a single-element array', () => {
		expect(parseKeyRing(JSON.stringify(['only-key']))).toEqual(['only-key']);
	});
});
