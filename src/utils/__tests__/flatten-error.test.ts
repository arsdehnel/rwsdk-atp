import { describe, expect, it } from 'vitest';
import { flattenError } from '../flatten-error';

describe('flattenError', () => {
	it('returns the original Error instance', () => {
		const original = new Error('boom');
		const { error } = flattenError(original);
		expect(error).toBe(original);
	});

	it('wraps a non-Error value in a new Error', () => {
		const { error } = flattenError('something went wrong');
		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toBe('something went wrong');
	});

	it('returns an empty message string when there is no cause', () => {
		const { message } = flattenError(new Error('no cause'));
		expect(message).toBe('');
	});

	it('returns the cause message prefixed with ": " when cause is an Error', () => {
		const cause = new Error('underlying problem');
		const outer = new Error('outer', { cause });
		const { message } = flattenError(outer);
		expect(message).toBe(': underlying problem');
	});

	it('returns an empty message when cause is not an Error', () => {
		const outer = new Error('outer', { cause: 'string cause' });
		const { message } = flattenError(outer);
		expect(message).toBe('');
	});

	describe('with non-Error inputs (consumers often blindly pass unknown values)', () => {
		it('wraps null, producing message "null"', () => {
			const { error, message } = flattenError(null);
			expect(error.message).toBe('null');
			expect(message).toBe('');
		});

		it('wraps undefined, producing message "undefined"', () => {
			const { error, message } = flattenError(undefined);
			expect(error.message).toBe('undefined');
			expect(message).toBe('');
		});

		it('wraps a number, producing its string representation', () => {
			const { error, message } = flattenError(42);
			expect(error.message).toBe('42');
			expect(message).toBe('');
		});

		it('wraps a plain object', () => {
			const { error, message } = flattenError({ code: 500 });
			expect(error).toBeInstanceOf(Error);
			expect(message).toBe('');
		});

		it('wraps a string', () => {
			const { error, message } = flattenError('oops');
			expect(error.message).toBe('oops');
			expect(message).toBe('');
		});
	});
});
