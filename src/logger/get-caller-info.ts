// Walks up the call stack and returns "filename.ts:line" for the first frame
// outside the parent logger file that calls this method.
// Only meaningful in dev where source maps are active.
export function getCallerInfo(): string | undefined {
	try {
		const stack = new Error().stack;
		let alreadyFoundMatch = false;
		if (!stack) return undefined;
		for (const line of stack.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed.startsWith('at ')) continue;
			if (/logger\.[jt]s/.test(trimmed)) continue;
			const matches = trimmed.match(/\(?([^()\s]+):(\d+):\d+\)?$/);
			if (matches) {
				if (alreadyFoundMatch) {
					const rawPath = matches[1].replace(/^file:\/\//, '');
					const parts = rawPath.split('/');
					return `${parts.slice(-2).join('/')}:${matches[2]}`;
				} else {
					alreadyFoundMatch = true;
				}
			}
		}
		return undefined;
	} catch {
		return undefined;
	}
}
