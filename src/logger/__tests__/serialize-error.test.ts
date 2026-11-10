import { describe, expect, it } from 'vitest';
import { serializeError } from '../serialize-error';

describe('serializeError', () => {
	it('includes message and stack', () => {
		const err = new Error('boom');
		const result = serializeError(err);
		expect(result.message).toBe('boom');
		expect(typeof result.stack).toBe('string');
	});

	it('does not include cause when not set', () => {
		const result = serializeError(new Error('no cause'));
		expect('cause' in result).toBe(false);
	});

	it('recursively serializes an Error cause', () => {
		const cause = new Error('root cause');
		const outer = new Error('outer', { cause });
		const result = serializeError(outer);
		expect((result.cause as Record<string, unknown>).message).toBe('root cause');
	});

	it('includes a non-Error cause as-is', () => {
		const outer = new Error('outer', { cause: 'string cause' });
		expect(serializeError(outer).cause).toBe('string cause');
	});

	it('includes enumerable own properties from custom error subclasses', () => {
		class DatabaseError extends Error {
			query: string;
			constructor(message: string, query: string) {
				super(message);
				this.query = query;
			}
		}
		const err = new DatabaseError('query failed', 'SELECT *');
		const result = serializeError(err);
		expect(result.query).toBe('SELECT *');
	});
});
