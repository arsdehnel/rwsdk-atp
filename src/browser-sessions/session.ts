export type Session = {
	sessionId: string;
	userId?: string | null;
	did: string | null;
	challenge?: string | null;
	lastAccessedAt: number;
};
