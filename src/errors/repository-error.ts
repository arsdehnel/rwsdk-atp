export const RepositoryErrorTypes = {
	UnexpectedRecordCount: 'unexpected-record-count',
	InvalidUUID: 'invalid-uuid',
	InvalidDID: 'invalid-did',
	SingleInstanceError: 'single-instance-error',
} as const;

export class RepositoryError extends Error {
	constructor(
		public type: (typeof RepositoryErrorTypes)[keyof typeof RepositoryErrorTypes],
		public details: unknown[],
	) {
		let message = '';
		switch (type) {
			case RepositoryErrorTypes.UnexpectedRecordCount: {
				const [actual, expected, entity] = details as [number, number, string];
				message = `Expected ${expected} ${entity} record(s), but found ${actual}`;
				break;
			}
			case RepositoryErrorTypes.InvalidUUID: {
				const [value, entity] = details as [string, string];
				message = `The value "${value}" is not a valid ID for a ${entity}`;
				break;
			}
			case RepositoryErrorTypes.InvalidDID: {
				const [value, entity] = details as [string, string];
				message = `The value "${value}" is not a valid DID for a ${entity}`;
				break;
			}
			case RepositoryErrorTypes.SingleInstanceError: {
				const [singleInstanceMessage] = details as [string];
				message = singleInstanceMessage;
				break;
			}
			default:
				message = 'An unknown repository error occurred';
		}
		super(message);
		this.name = 'RepositoryError';
		this.type = type;
	}
}
