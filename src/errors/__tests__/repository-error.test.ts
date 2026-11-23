import { describe, expect, it } from 'vitest';
import {
	InvalidDIDError,
	InvalidUUIDError,
	MissingAtpRecordError,
	NoRecordFoundError,
	RepositoryError,
	TooManyRecordsFoundError,
} from '../repository-error';

describe('RepositoryError (base)', () => {
	it('all subclasses are instances of Error', () => {
		expect(new NoRecordFoundError('User')).toBeInstanceOf(Error);
		expect(new TooManyRecordsFoundError('User', 3, 1)).toBeInstanceOf(Error);
		expect(new InvalidUUIDError('abc', 'User')).toBeInstanceOf(Error);
		expect(new InvalidDIDError('abc', 'User')).toBeInstanceOf(Error);
		expect(new MissingAtpRecordError('topic', 'abc123')).toBeInstanceOf(Error);
	});

	it('all subclasses are instances of RepositoryError', () => {
		expect(new NoRecordFoundError('User')).toBeInstanceOf(RepositoryError);
		expect(new TooManyRecordsFoundError('User', 3, 1)).toBeInstanceOf(RepositoryError);
		expect(new InvalidUUIDError('abc', 'User')).toBeInstanceOf(RepositoryError);
		expect(new InvalidDIDError('abc', 'User')).toBeInstanceOf(RepositoryError);
		expect(new MissingAtpRecordError('topic', 'abc123')).toBeInstanceOf(RepositoryError);
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
