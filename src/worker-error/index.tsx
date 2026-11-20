import type { JSX } from 'react';
import { AccessError } from '../errors';
import type { Logger } from '../logger';
import RootErrorHandler from './RootErrorHandler';

export { RootErrorHandler };

type HandlerInfo = {
	request: Request;
	ctx: unknown;
};

export function handlePageError(error: unknown, { request, ctx }: HandlerInfo): Response | JSX.Element {
	// Response throws are control flow (redirects, etc.) — pass them through untouched
	if (error instanceof Response) {
		return error;
	}

	const isActionRequest = new URL(request.url).searchParams.has('__rsc_action_id');

	if (isActionRequest) {
		const message = error instanceof Error ? error.message : 'An unexpected error occurred';
		const code = error instanceof AccessError ? error.code : 500;
		return Response.json({ success: false, code, errors: { _form: [message] } }, { status: code });
	}

	// ctx.logger is added by the app's loggerMiddleware; cast to access it
	(ctx as unknown as { logger: Logger }).logger.error('Unhandled page error', { error });
	return <RootErrorHandler error={error} />;
}
