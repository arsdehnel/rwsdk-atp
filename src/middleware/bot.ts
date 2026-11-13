export function botMiddleware({ request }: { request: Request }): Response | undefined {
	// Blocks the React DevTools probe that generates noise in logs
	if (request.url.toLowerCase().includes('installhook.js.map')) {
		return Response.json({ success: false, message: 'Bot protection' }, { status: 405 });
	}
}
