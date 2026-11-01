export type Session = {
	sessionId: string;
	userId?: string | null;
	challenge?: string | null;
	lastAccessedAt: number;
};
