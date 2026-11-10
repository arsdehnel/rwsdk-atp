export function packSessionId(unsignedSessionId: string, signature: string): string {
	if (unsignedSessionId.includes(':')) {
		throw new Error('Invalid session ID: unsigned session ID must not contain ":"');
	}
	return btoa([unsignedSessionId, signature].join(':'));
}
