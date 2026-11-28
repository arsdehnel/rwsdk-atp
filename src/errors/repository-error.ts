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

export class RepositoryOperationError extends RepositoryError {
	public readonly code = 500;

	constructor(description: string, cause?: unknown) {
		super(`Repository operation failed: ${description}`);
		this.name = 'RepositoryOperationError';
		if (cause instanceof Error) {
			this.cause = cause;
		}
	}
}

export class DatabaseOperationError extends RepositoryError {
	public readonly code = 500;

	constructor(description: string, cause?: unknown) {
		super(`Database operation failed: ${description}`);
		this.name = 'DatabaseOperationError';
		if (cause instanceof Error) {
			this.cause = cause;
		}
	}
}

export class AtpOperationError extends RepositoryError {
	public readonly code = 500;
	public readonly atpStatus?: number;
	public readonly atpError?: string;
	public readonly retryable: boolean;

	constructor(description: string, cause?: unknown) {
		super(`ATP operation failed: ${description}`);
		this.name = 'AtpOperationError';
		if (cause instanceof Error) {
			this.cause = cause;
		}
		if (cause != null && typeof cause === 'object') {
			const c = cause as Record<string, unknown>;
			// Only capture real HTTP status codes; XrpcFetchError uses ResponseType.Unknown = 1
			if (typeof c.status === 'number' && c.status >= 100) {
				this.atpStatus = c.status;
			}
			if (typeof c.error === 'string') {
				this.atpError = c.error;
			}
			this.retryable = typeof c.shouldRetry === 'function' ? Boolean((c.shouldRetry as () => unknown)()) : false;
		} else {
			this.retryable = false;
		}
	}
}
