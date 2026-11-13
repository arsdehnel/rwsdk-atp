import { describe, expect, it } from 'vitest';
import { StepError } from '../step-error';

describe('StepError', () => {
	it('stores code, publicMessage, and devMessage', () => {
		const err = new StepError(500, 'Something went wrong', 'DB connection timed out after 30s');
		expect(err.code).toBe(500);
		expect(err.publicMessage).toBe('Something went wrong');
		expect(err.devMessage).toBe('DB connection timed out after 30s');
		expect(err.message).toBe('DB connection timed out after 30s');
	});

	it('defaults retryable to false', () => {
		const err = new StepError(500, 'Error', 'dev detail');
		expect(err.retryable).toBe(false);
	});

	it('accepts retryable flag', () => {
		const err = new StepError(503, 'Unavailable', 'upstream timeout', true);
		expect(err.retryable).toBe(true);
	});

	it('accepts a cause', () => {
		const cause = new Error('original');
		const err = new StepError(500, 'Error', 'dev detail', false, cause);
		expect(err.cause).toBe(cause);
	});

	it('sets name to StepError', () => {
		const err = new StepError(500, 'Error', 'dev detail');
		expect(err.name).toBe('StepError');
	});

	it('is an instance of Error', () => {
		const err = new StepError(500, 'Error', 'dev detail');
		expect(err).toBeInstanceOf(Error);
	});
});
