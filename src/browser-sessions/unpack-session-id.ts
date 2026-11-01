interface SessionIdParts {
	unsignedSessionId: string;
	signature: string;
}

export function unpackSessionId(packed: string): SessionIdParts {
	const [unsignedSessionId, signature] = atob(packed).split(':');
	return { unsignedSessionId, signature };
}
