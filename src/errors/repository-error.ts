export abstract class RepositoryError extends Error {
	public abstract readonly code: number;

	constructor(message: string) {
		super(message);
		this.name = 'RepositoryError';
	}
}

export class NoRecordFoundError extends RepositoryError {
	public readonly code: number;

	constructor(entity: string, code = 404) {
		super(`${entity} not found`);
		this.name = 'NoRecordFoundError';
		this.code = code;
	}
}

export class TooManyRecordsFoundError extends RepositoryError {
	public readonly code = 500;

	constructor(entity: string, actual: number, expected: number) {
		super(`${entity} expected ${expected}, got ${actual}`);
		this.name = 'TooManyRecordsFoundError';
	}
}

export class InvalidUUIDError extends RepositoryError {
	public readonly code = 400;

	constructor(value: string, entity: string) {
		super(`The value "${value}" is not a valid ID for a ${entity}`);
		this.name = 'InvalidUUIDError';
	}
}

export class InvalidDIDError extends RepositoryError {
	public readonly code = 400;

	constructor(value: string, entity: string) {
		super(`The value "${value}" is not a valid DID for a ${entity}`);
		this.name = 'InvalidDIDError';
	}
}

export class MissingAtpRecordError extends RepositoryError {
	public readonly code = 500;

	constructor(entity: string, id: string) {
		super(`${entity} ${id} has no ATP record`);
		this.name = 'MissingAtpRecordError';
	}
}
