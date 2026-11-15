import { AccessError, RepositoryError } from '../errors';

export type ApiResponse<T> = { data: T; errors?: never } | { data?: never; errors: string[] | Record<string, string[]> };

export type ActionState<T> =
	| { success: true; code: number; data: T }
	| { success: false; code: number; errors: Record<string, string[]> };

type ZodIssue = { path: Array<string | number>; message: string };

function isZodLikeError(err: unknown): err is { issues: ZodIssue[] } {
	return err instanceof Error && 'issues' in err && Array.isArray((err as Record<string, unknown>).issues);
}

function flattenZodIssues(issues: ZodIssue[]): Record<string, string[]> {
	const errors: Record<string, string[]> = {};
	for (const issue of issues) {
		const key = issue.path.length > 0 ? issue.path.map(String).join('.') : '_form';
		if (!errors[key]) errors[key] = [];
		errors[key].push(issue.message);
	}
	return errors;
}

export function apiSuccessResponse<T>(data: T, status = 200): Response {
	return Response.json({ data }, { status });
}

export function apiErrorResponse(err: unknown, fallbackMessage: string, verboseErrors: boolean): Response {
	if (isZodLikeError(err)) {
		return Response.json({ errors: flattenZodIssues(err.issues) }, { status: 400 });
	}
	if (err instanceof AccessError) {
		return Response.json({ errors: [err.message] }, { status: err.code });
	}
	if (err instanceof RepositoryError && err.code < 500) {
		return Response.json({ errors: [err.message] }, { status: err.code });
	}

	const status = 500;
	if (verboseErrors) {
		if (err instanceof Error) {
			return Response.json({ errors: buildErrorChain(err) }, { status });
		}
		return Response.json({ errors: [String(err)] }, { status });
	}
	return Response.json({ errors: [fallbackMessage] }, { status });
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
