import { stringifySetCookie } from 'cookie';

export function setSessionCookie(
	sessionIdCookieKey: string,
	requestUrl: string,
	signedSessionId: string,
	maxAge: number,
	headers: Headers,
): void {
	const isSecure = new URL(requestUrl).protocol === 'https:';
	headers.set(
		'Set-Cookie',
		stringifySetCookie({
			name: sessionIdCookieKey,
			value: signedSessionId,
			path: '/',
			httpOnly: true,
			secure: isSecure,
			sameSite: 'lax',
			maxAge,
		}),
	);
}
