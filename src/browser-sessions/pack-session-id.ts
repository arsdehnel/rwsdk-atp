export function packSessionId(unsignedSessionId: string, signature: string): string {
	return btoa([unsignedSessionId, signature].join(':'));
}
