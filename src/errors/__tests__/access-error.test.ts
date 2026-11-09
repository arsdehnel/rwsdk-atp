import { describe, expect, it } from 'vitest';
import { AccessError } from '../access-error';

describe('AccessError', () => {
	it('is an instance of Error', () => {
		expect(new AccessError(403, 'Forbidden')).toBeInstanceOf(Error);
	});

	it('has name AccessError', () => {
		expect(new AccessError(403, 'Forbidden').name).toBe('AccessError');
	});

	it('stores code on the instance', () => {
		const err = new AccessError(401, 'Unauthorized');
		expect(err.code).toBe(401);
	});

	it('sets message from the constructor argument', () => {
		const err = new AccessError(403, 'Forbidden');
		expect(err.message).toBe('Forbidden');
	});
});
