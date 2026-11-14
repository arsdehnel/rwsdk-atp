import { describe, expect, it } from 'vitest';
import { RepositoryError, RepositoryErrorTypes } from '../repository-error';

describe('RepositoryError', () => {
	it('is an instance of Error', () => {
		expect(new RepositoryError(RepositoryErrorTypes.UnexpectedRecordCount, [0, 1, 'user'])).toBeInstanceOf(Error);
	});

	it('has name RepositoryError', () => {
		const err = new RepositoryError(RepositoryErrorTypes.UnexpectedRecordCount, [0, 1, 'user']);
		expect(err.name).toBe('RepositoryError');
	});

	it('stores type on the instance', () => {
		const err = new RepositoryError(RepositoryErrorTypes.InvalidUUID, ['abc', 'game']);
		expect(err.type).toBe(RepositoryErrorTypes.InvalidUUID);
	});

	it('stores type on the did type instance', () => {
		const err = new RepositoryError(RepositoryErrorTypes.InvalidDID, ['def', 'user']);
		expect(err.type).toBe(RepositoryErrorTypes.InvalidDID);
	});

	describe('UnexpectedRecordCount', () => {
		it('formats the message with actual, expected, and entity', () => {
			const err = new RepositoryError(RepositoryErrorTypes.UnexpectedRecordCount, [0, 1, 'user']);
			expect(err.message).toBe('Expected 1 user record(s), but found 0');
		});
	});

	describe('InvalidUUID', () => {
		it('formats the message with the value and entity', () => {
			const err = new RepositoryError(RepositoryErrorTypes.InvalidUUID, ['not-a-uuid', 'game']);
			expect(err.message).toBe('The value "not-a-uuid" is not a valid ID for a game');
		});
	});

	describe('InvalidDID', () => {
		it('formats the message with the value and entity', () => {
			const err = new RepositoryError(RepositoryErrorTypes.InvalidDID, ['not-a-did', 'user']);
			expect(err.message).toBe('The value "not-a-did" is not a valid DID for a user');
		});
	});

	describe('unknown type (default branch)', () => {
		it('falls back to the generic message', () => {
			const err = new RepositoryError('not-a-real-type' as any, []);
			expect(err.message).toBe('An unknown repository error occurred');
		});
	});
});
