import { describe, expect, it } from 'vitest';
import { setSessionCookie } from '../set-session-cookie';

const COOKIE_KEY = 'session_id';
const SIGNED_ID = 'signed-session-value';
const MAX_AGE = 3600;

describe('setSessionCookie', () => {
	it('sets the Secure flag when the request URL uses https', () => {
		const headers = new Headers();
		setSessionCookie(COOKIE_KEY, 'https://example.com/path', SIGNED_ID, MAX_AGE, headers);
		expect(headers.get('Set-Cookie')).toContain('Secure');
	});

	it('does not set the Secure flag when the request URL uses http', () => {
		const headers = new Headers();
		setSessionCookie(COOKIE_KEY, 'http://localhost:3000/path', SIGNED_ID, MAX_AGE, headers);
		expect(headers.get('Set-Cookie')).not.toContain('Secure');
	});

	it('sets HttpOnly', () => {
		const headers = new Headers();
		setSessionCookie(COOKIE_KEY, 'https://example.com', SIGNED_ID, MAX_AGE, headers);
		expect(headers.get('Set-Cookie')).toContain('HttpOnly');
	});

	it('sets SameSite=Lax', () => {
		const headers = new Headers();
		setSessionCookie(COOKIE_KEY, 'https://example.com', SIGNED_ID, MAX_AGE, headers);
		expect(headers.get('Set-Cookie')).toContain('SameSite=Lax');
	});

	it('sets Path=/', () => {
		const headers = new Headers();
		setSessionCookie(COOKIE_KEY, 'https://example.com', SIGNED_ID, MAX_AGE, headers);
		expect(headers.get('Set-Cookie')).toContain('Path=/');
	});

	it('includes the maxAge value', () => {
		const headers = new Headers();
		setSessionCookie(COOKIE_KEY, 'https://example.com', SIGNED_ID, MAX_AGE, headers);
		expect(headers.get('Set-Cookie')).toContain('Max-Age=3600');
	});

	it('uses the provided cookie name and value', () => {
		const headers = new Headers();
		setSessionCookie(COOKIE_KEY, 'https://example.com', SIGNED_ID, MAX_AGE, headers);
		expect(headers.get('Set-Cookie')).toContain(`${COOKIE_KEY}=${SIGNED_ID}`);
	});

	it('a maxAge of 0 produces Max-Age=0 (used for cookie deletion)', () => {
		const headers = new Headers();
		setSessionCookie(COOKIE_KEY, 'https://example.com', '', 0, headers);
		expect(headers.get('Set-Cookie')).toContain('Max-Age=0');
	});
});
