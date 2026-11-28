import { describe, expect, it } from 'vitest';
import {
	AtpOperationError,
	DatabaseOperationError,
	InvalidDIDError,
	InvalidUUIDError,
	MissingAtpRecordError,
	NoRecordFoundError,
	RepositoryError,
	RepositoryOperationError,
	TooManyRecordsFoundError,
} from '../repository-error';

describe('RepositoryError (base)', () => {
	it('all subclasses are instances of Error', () => {
		expect(new NoRecordFoundError('User')).toBeInstanceOf(Error);
		expect(new TooManyRecordsFoundError('User', 3, 1)).toBeInstanceOf(Error);
		expect(new InvalidUUIDError('abc', 'User')).toBeInstanceOf(Error);
		expect(new InvalidDIDError('abc', 'User')).toBeInstanceOf(Error);
		expect(new MissingAtpRecordError('topic', 'abc123')).toBeInstanceOf(Error);
		expect(new DatabaseOperationError('doing something')).toBeInstanceOf(Error);
		expect(new AtpOperationError('doing something')).toBeInstanceOf(Error);
	});

	it('all subclasses are instances of RepositoryError', () => {
		expect(new NoRecordFoundError('User')).toBeInstanceOf(RepositoryError);
		expect(new TooManyRecordsFoundError('User', 3, 1)).toBeInstanceOf(RepositoryError);
		expect(new InvalidUUIDError('abc', 'User')).toBeInstanceOf(RepositoryError);
		expect(new InvalidDIDError('abc', 'User')).toBeInstanceOf(RepositoryError);
		expect(new MissingAtpRecordError('topic', 'abc123')).toBeInstanceOf(RepositoryError);
		expect(new DatabaseOperationError('doing something')).toBeInstanceOf(RepositoryError);
		expect(new AtpOperationError('doing something')).toBeInstanceOf(RepositoryError);
	});
});

describe('NoRecordFoundError', () => {
	it('formats the message with the entity', () => {
		const err = new NoRecordFoundError('Stance');
		expect(err.message).toBe('Stance not found');
	});

	it('defaults to code 404', () => {
		const err = new NoRecordFoundError('Stance');
		expect(err.code).toBe(404);
	});

	it('accepts a code override', () => {
		const err = new NoRecordFoundError('User', 500);
		expect(err.code).toBe(500);
	});

	it('has name NoRecordFoundError', () => {
		const err = new NoRecordFoundError('Stance');
		expect(err.name).toBe('NoRecordFoundError');
	});
});

describe('TooManyRecordsFoundError', () => {
	it('formats the message with entity, expected, and actual', () => {
		const err = new TooManyRecordsFoundError('Stance', 3, 1);
		expect(err.message).toBe('Stance expected 1, got 3');
	});

	it('defaults to code 500', () => {
		const err = new TooManyRecordsFoundError('Stance', 3, 1);
		expect(err.code).toBe(500);
	});

	it('has name TooManyRecordsFoundError', () => {
		const err = new TooManyRecordsFoundError('Stance', 3, 1);
		expect(err.name).toBe('TooManyRecordsFoundError');
	});
});

describe('InvalidUUIDError', () => {
	it('formats the message with the value and entity', () => {
		const err = new InvalidUUIDError('not-a-uuid', 'Game');
		expect(err.message).toBe('The value "not-a-uuid" is not a valid ID for a Game');
	});

	it('defaults to code 400', () => {
		const err = new InvalidUUIDError('not-a-uuid', 'Game');
		expect(err.code).toBe(400);
	});

	it('has name InvalidUUIDError', () => {
		const err = new InvalidUUIDError('not-a-uuid', 'Game');
		expect(err.name).toBe('InvalidUUIDError');
	});
});

describe('InvalidDIDError', () => {
	it('formats the message with the value and entity', () => {
		const err = new InvalidDIDError('not-a-did', 'User');
		expect(err.message).toBe('The value "not-a-did" is not a valid DID for a User');
	});

	it('defaults to code 400', () => {
		const err = new InvalidDIDError('not-a-did', 'User');
		expect(err.code).toBe(400);
	});

	it('has name InvalidDIDError', () => {
		const err = new InvalidDIDError('not-a-did', 'User');
		expect(err.name).toBe('InvalidDIDError');
	});
});

describe('MissingAtpRecordError', () => {
	it('formats the message with the entity and id', () => {
		const err = new MissingAtpRecordError('topic', 'abc123');
		expect(err.message).toBe('topic abc123 has no ATP record');
	});

	it('has code 500', () => {
		const err = new MissingAtpRecordError('topic', 'abc123');
		expect(err.code).toBe(500);
	});

	it('has name MissingAtpRecordError', () => {
		const err = new MissingAtpRecordError('topic', 'abc123');
		expect(err.name).toBe('MissingAtpRecordError');
	});
});

describe('RepositoryOperationError', () => {
	it('is an instance of RepositoryError', () => {
		expect(new RepositoryOperationError('doing something')).toBeInstanceOf(RepositoryError);
	});

	it('formats the message with the description', () => {
		const err = new RepositoryOperationError('inserting Topic');
		expect(err.message).toBe('Repository operation failed: inserting Topic');
	});

	it('has code 500', () => {
		const err = new RepositoryOperationError('inserting Topic');
		expect(err.code).toBe(500);
	});

	it('has name RepositoryOperationError', () => {
		const err = new RepositoryOperationError('inserting Topic');
		expect(err.name).toBe('RepositoryOperationError');
	});

	it('sets cause when an Error is provided', () => {
		const cause = new Error('DB connection refused');
		const err = new RepositoryOperationError('inserting Topic', cause);
		expect(err.cause).toBe(cause);
	});

	it('does not set cause for non-Error values', () => {
		const err = new RepositoryOperationError('inserting Topic', 'some string');
		expect(err.cause).toBeUndefined();
	});
});

describe('DatabaseOperationError', () => {
	it('is an instance of RepositoryError', () => {
		expect(new DatabaseOperationError('inserting Topic')).toBeInstanceOf(RepositoryError);
	});

	it('formats the message with the description', () => {
		const err = new DatabaseOperationError('inserting Topic');
		expect(err.message).toBe('Database operation failed: inserting Topic');
	});

	it('has code 500', () => {
		const err = new DatabaseOperationError('inserting Topic');
		expect(err.code).toBe(500);
	});

	it('has name DatabaseOperationError', () => {
		const err = new DatabaseOperationError('inserting Topic');
		expect(err.name).toBe('DatabaseOperationError');
	});

	it('sets cause when an Error is provided', () => {
		const cause = new Error('DB connection refused');
		const err = new DatabaseOperationError('inserting Topic', cause);
		expect(err.cause).toBe(cause);
	});

	it('does not set cause for non-Error values', () => {
		const err = new DatabaseOperationError('inserting Topic', 'some string');
		expect(err.cause).toBeUndefined();
	});
});

describe('AtpOperationError', () => {
	it('is an instance of RepositoryError', () => {
		expect(new AtpOperationError('creating record')).toBeInstanceOf(RepositoryError);
	});

	it('formats the message with the description', () => {
		const err = new AtpOperationError('creating record');
		expect(err.message).toBe('ATP operation failed: creating record');
	});

	it('has code 500', () => {
		const err = new AtpOperationError('creating record');
		expect(err.code).toBe(500);
	});

	it('has name AtpOperationError', () => {
		const err = new AtpOperationError('creating record');
		expect(err.name).toBe('AtpOperationError');
	});

	it('sets cause when an Error is provided', () => {
		const cause = new Error('connection refused');
		const err = new AtpOperationError('creating record', cause);
		expect(err.cause).toBe(cause);
	});

	it('defaults retryable to false when no cause', () => {
		const err = new AtpOperationError('creating record');
		expect(err.retryable).toBe(false);
	});

	it('defaults retryable to false when cause has no shouldRetry', () => {
		const err = new AtpOperationError('creating record', new Error('some failure'));
		expect(err.retryable).toBe(false);
	});

	it('extracts atpStatus from an XRPC-like error', () => {
		const xrpcLike = { status: 429, error: 'RateLimitExceeded', shouldRetry: () => true };
		const err = new AtpOperationError('creating record', xrpcLike);
		expect(err.atpStatus).toBe(429);
	});

	it('extracts atpError from an XRPC-like error', () => {
		const xrpcLike = { status: 401, error: 'AuthenticationRequired', shouldRetry: () => false };
		const err = new AtpOperationError('creating record', xrpcLike);
		expect(err.atpError).toBe('AuthenticationRequired');
	});

	it('extracts retryable: true from shouldRetry returning true', () => {
		const xrpcLike = { status: 503, error: 'UpstreamFailure', shouldRetry: () => true };
		const err = new AtpOperationError('creating record', xrpcLike);
		expect(err.retryable).toBe(true);
	});

	it('extracts retryable: false from shouldRetry returning false', () => {
		const xrpcLike = { status: 401, error: 'AuthenticationRequired', shouldRetry: () => false };
		const err = new AtpOperationError('creating record', xrpcLike);
		expect(err.retryable).toBe(false);
	});

	it('leaves atpStatus and atpError undefined when cause lacks those fields', () => {
		const err = new AtpOperationError('creating record', new Error('generic failure'));
		expect(err.atpStatus).toBeUndefined();
		expect(err.atpError).toBeUndefined();
	});

	it('leaves atpStatus undefined for XrpcFetchError pseudo-status (ResponseType.Unknown = 1)', () => {
		// XrpcFetchError sets status to ResponseType.Unknown (1), not a real HTTP status
		const fetchErr = { status: 1, error: 'InternalServerError', shouldRetry: () => true };
		const err = new AtpOperationError('creating record', fetchErr);
		expect(err.atpStatus).toBeUndefined();
		expect(err.atpError).toBe('InternalServerError');
		expect(err.retryable).toBe(true);
	});
});
