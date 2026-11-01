export function serializeError(err: Error): Record<string, unknown> {
	const result: Record<string, unknown> = {
		// Spread enumerable own properties (e.g. DrizzleQueryError.query, .params, .name,
		// and .cause when set as an instance property via `this.cause = x`).
		...err,
		// Always explicitly include non-enumerable standard Error properties.
		message: err.message,
		stack: err.stack,
	};

	// Always serialize cause explicitly so it is never silently dropped.
	// .cause can be enumerable (Drizzle pattern: `this.cause = x`) or non-enumerable
	// (ES2022 pattern: `new Error(msg, { cause })`). Either way it is readable as
	// err.cause, but JSON.stringify of a plain Error gives {} so we must serialize it.
	if (err.cause !== undefined) {
		result.cause = err.cause instanceof Error ? serializeError(err.cause) : err.cause;
	}

	return result;
}
