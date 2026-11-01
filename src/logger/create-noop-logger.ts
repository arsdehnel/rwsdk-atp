import type { Logger } from './types';

export function createNoopLogger(): Logger {
	const noop = (): void => {};
	return {
		debug: noop,
		info: noop,
		warn: noop,
		error: noop,
		child: () => createNoopLogger(),
	};
}
