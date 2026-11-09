export class AccessError extends Error {
	constructor(
		public code: number,
		message: string,
	) {
		super(message);
		this.name = 'AccessError';
	}
}
