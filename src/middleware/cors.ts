/**
 * Map of path → allowed methods for CORS.
 * Only paths listed here will have CORS headers applied.
 *
 * @example
 * createCorsMiddleware({ '/api/import': ['POST'] })
 */
export function createCorsMiddleware(
	routes: Record<string, string[]>,
): (requestInfo: { request: Request; response: Response }) => Response | undefined {
	return function corsMiddleware({ request, response }: { request: Request; response: Response }): Response | undefined {
		const originHeader = request.headers.get('Origin');
		if (!originHeader) return;

		const path = new URL(request.url).pathname;
		const allowedMethods = routes[path];
		if (!allowedMethods) return;

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': originHeader,
					'Access-Control-Allow-Credentials': 'true',
					'Access-Control-Allow-Methods': ['OPTIONS', ...allowedMethods].join(', '),
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		response.headers.append('Access-Control-Allow-Origin', originHeader);
		response.headers.append('Access-Control-Allow-Credentials', 'true');
		response.headers.append('Access-Control-Allow-Methods', ['OPTIONS', ...allowedMethods].join(', '));
		response.headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	};
}
