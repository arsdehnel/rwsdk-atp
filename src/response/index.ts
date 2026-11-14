import { AccessError, RepositoryError } from '../errors';

export type ActionState<T> =
	| { success: true; code: number; data: T }
	| { success: false; code: number; errors: Record<string, string[]> };

export function apiSuccessResponse<T>(data: T, status = 200): Response {
	return Response.json({ success: true, data }, { status });
}

export function apiErrorResponse(err: unknown, fallbackMessage: string, verboseErrors: boolean): Response {
	if (err instanceof AccessError) {
		return Response.json({ success: false, error: err.message }, { status: err.code });
	}
	if (err instanceof RepositoryError && err.code < 500) {
		return Response.json({ success: false, error: err.message }, { status: err.code });
	}

	const status = 500;
	if (verboseErrors) {
		if (err instanceof Error) {
			return Response.json(
				{
					success: false,
					error: err.message,
					...(err.cause !== undefined ? { cause: serializeCause(err.cause) } : {}),
				},
				{ status },
			);
		}
		return Response.json({ success: false, error: String(err) }, { status });
	}
	return Response.json({ success: false, error: fallbackMessage }, { status });
}

export function actionSuccessResponse<T>(data: T, status = 200): ActionState<T> {
	return { success: true, code: status, data };
}

export function actionValidationError<T>(errors: Record<string, string[]>, status = 400): ActionState<T> {
	return { success: false, code: status, errors };
}

export function toFormErrors<T>(state: ActionState<T>): { form?: string; fields: Record<string, string> } | undefined {
	if (state.success) return undefined;
	const { _form, ...fieldErrors } = state.errors;
	return {
		...((_form?.length ?? 0) > 0 ? { form: _form.join(', ') } : {}),
		fields: Object.fromEntries(Object.entries(fieldErrors).map(([key, msgs]) => [key, msgs.join(', ')])),
	};
}

export function actionErrorResponse<T>(err: unknown, fallbackMessage: string, verboseErrors: boolean): ActionState<T> {
	if (err instanceof AccessError) {
		return { success: false, code: err.code, errors: { _form: [err.message] } };
	}
	if (err instanceof RepositoryError && err.code < 500) {
		return { success: false, code: err.code, errors: { _form: [err.message] } };
	}

	if (!verboseErrors) {
		return { success: false, code: 500, errors: { _form: [fallbackMessage] } };
	}

	if (err instanceof Error) {
		return { success: false, code: 500, errors: { _form: buildErrorChain(err) } };
	}

	return { success: false, code: 500, errors: { _form: [String(err)] } };
}

function serializeCause(cause: unknown): unknown {
	if (cause instanceof Error) {
		return {
			name: cause.name,
			message: cause.message,
			...(cause.cause !== undefined ? { cause: serializeCause(cause.cause) } : {}),
		};
	}
	return cause;
}

function buildErrorChain(err: Error): string[] {
	const parts: string[] = [err.message];
	let cause: unknown = err.cause;
	while (cause instanceof Error) {
		parts.push(cause.message);
		cause = cause.cause;
	}
	if (cause !== undefined) {
		parts.push(String(cause));
	}
	return parts;
}
