import { describe, expect, it } from 'vitest';
import { createCorsMiddleware } from '../cors';

const corsMiddleware = createCorsMiddleware({ '/api/import': ['POST'] });

function makeRequestInfo(method: string, url: string, origin?: string) {
	const headers = new Headers();
	if (origin) headers.set('Origin', origin);
	return {
		request: new Request(url, { method, headers }),
		response: new Response(null),
	} as any;
}

describe('createCorsMiddleware', () => {
	describe('OPTIONS preflight on allowed path', () => {
		it('returns 204', () => {
			const result = corsMiddleware(makeRequestInfo('OPTIONS', 'https://example.com/api/import', 'https://external.com'));
			expect(result).toBeInstanceOf(Response);
			expect((result as Response).status).toBe(204);
		});

		it('echoes the Origin header', () => {
			const result = corsMiddleware(
				makeRequestInfo('OPTIONS', 'https://example.com/api/import', 'https://external.com'),
			) as Response;
			expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://external.com');
		});

		it('includes the configured method and OPTIONS', () => {
			const result = corsMiddleware(
				makeRequestInfo('OPTIONS', 'https://example.com/api/import', 'https://external.com'),
			) as Response;
			expect(result.headers.get('Access-Control-Allow-Methods')).toContain('POST');
			expect(result.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
		});
	});

	describe('actual request on allowed path', () => {
		it('appends CORS headers to the response', () => {
			const info = makeRequestInfo('POST', 'https://example.com/api/import', 'https://external.com');
			const result = corsMiddleware(info);
			expect(result).toBeUndefined();
			expect(info.response.headers.get('Access-Control-Allow-Origin')).toBe('https://external.com');
		});
	});

	describe('passes through', () => {
		it('when no Origin header', () => {
			const result = corsMiddleware(makeRequestInfo('OPTIONS', 'https://example.com/api/import'));
			expect(result).toBeUndefined();
		});

		it('when path is not in routes', () => {
			const result = corsMiddleware(makeRequestInfo('OPTIONS', 'https://example.com/api/other', 'https://external.com'));
			expect(result).toBeUndefined();
		});
	});
});
