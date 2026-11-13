import { describe, expect, it } from 'vitest';
import { botMiddleware } from '../bot';

describe('botMiddleware', () => {
	it('returns 405 for installHook.js.map requests', () => {
		const result = botMiddleware({ request: new Request('https://example.com/installHook.js.map') } as any);
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(405);
	});

	it('is case-insensitive', () => {
		const result = botMiddleware({ request: new Request('https://example.com/INSTALLHOOK.JS.MAP') } as any);
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(405);
	});

	it('returns undefined for normal requests', () => {
		const result = botMiddleware({ request: new Request('https://example.com/api/status') } as any);
		expect(result).toBeUndefined();
	});
});
