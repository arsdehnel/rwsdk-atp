import { describe, expect, it } from 'vitest';
import { AccessError } from '../../errors/access-error';
import { InvalidUUIDError, NoRecordFoundError, TooManyRecordsFoundError } from '../../errors/repository-error';
import {
	actionErrorResponse,
	actionSuccessResponse,
	actionValidationError,
	apiErrorResponse,
	apiSuccessResponse,
	toFormErrors,
} from '../index';

describe('apiSuccessResponse', () => {
	it('returns 200 with success shape by default', async () => {
		const res = apiSuccessResponse({ id: 1 });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ success: true, data: { id: 1 } });
	});

	it('respects a custom status', async () => {
		const res = apiSuccessResponse({}, 201);
		expect(res.status).toBe(201);
	});
});

describe('apiErrorResponse', () => {
	describe('typed errors', () => {
		it('uses AccessError code and message directly', async () => {
			const err = new AccessError(403, 'Forbidden');
			const res = apiErrorResponse(err, 'fallback', false);
			expect(res.status).toBe(403);
			expect(await res.json()).toEqual({ success: false, error: 'Forbidden' });
		});

		it('uses RepositoryError code and message when code < 500', async () => {
			const err = new NoRecordFoundError('User');
			const res = apiErrorResponse(err, 'fallback', false);
			expect(res.status).toBe(404);
			expect(await res.json()).toEqual({ success: false, error: 'User not found' });
		});

		it('uses RepositoryError code and message for 400-range errors', async () => {
			const err = new InvalidUUIDError('abc', 'Post');
			const res = apiErrorResponse(err, 'fallback', false);
			expect(res.status).toBe(400);
			expect(await res.json()).toMatchObject({ success: false, error: expect.stringContaining('abc') });
		});

		it('falls through to 500 for RepositoryError with code >= 500', async () => {
			const err = new TooManyRecordsFoundError('User', 2, 1);
			const res = apiErrorResponse(err, 'fallback message', false);
			expect(res.status).toBe(500);
			expect(await res.json()).toEqual({ success: false, error: 'fallback message' });
		});
	});

	describe('verboseErrors: false', () => {
		it('returns 500 with fallback message', async () => {
			const res = apiErrorResponse(new Error('internal detail'), 'Something went wrong', false);
			expect(res.status).toBe(500);
			expect(await res.json()).toEqual({ success: false, error: 'Something went wrong' });
		});
	});

	describe('verboseErrors: true', () => {
		it('returns the error message', async () => {
			const res = apiErrorResponse(new Error('internal detail'), 'fallback', true);
			expect(res.status).toBe(500);
			expect(await res.json()).toMatchObject({ success: false, error: 'internal detail' });
		});

		it('includes serialized cause when present', async () => {
			const cause = new Error('root cause');
			const err = new Error('outer error', { cause });
			const body = (await apiErrorResponse(err, 'fallback', true).json()) as Record<string, unknown>;
			expect(body.cause).toEqual({ name: 'Error', message: 'root cause' });
		});

		it('serializes nested causes recursively', async () => {
			const root = new Error('root');
			const mid = new Error('middle', { cause: root });
			const err = new Error('outer', { cause: mid });
			const body = (await apiErrorResponse(err, 'fallback', true).json()) as { cause: Record<string, unknown> };
			expect(body.cause.cause).toEqual({ name: 'Error', message: 'root' });
		});

		it('omits cause key when no cause', async () => {
			const body = await apiErrorResponse(new Error('no cause'), 'fallback', true).json();
			expect(body).not.toHaveProperty('cause');
		});

		it('handles non-Error values', async () => {
			const res = apiErrorResponse('string error', 'fallback', true);
			expect(res.status).toBe(500);
			expect(await res.json()).toEqual({ success: false, error: 'string error' });
		});
	});
});

describe('actionSuccessResponse', () => {
	it('returns success shape with code 200 by default', () => {
		expect(actionSuccessResponse({ id: 1 })).toEqual({ success: true, code: 200, data: { id: 1 } });
	});

	it('respects a custom status', () => {
		expect(actionSuccessResponse({}, 201)).toMatchObject({ code: 201 });
	});
});

describe('actionValidationError', () => {
	it('passes field errors through with code 400 by default', () => {
		const errors = { email: ['Email is required'], name: ['Name is too short'] };
		expect(actionValidationError(errors)).toEqual({ success: false, code: 400, errors });
	});

	it('respects a custom status', () => {
		expect(actionValidationError({}, 422)).toMatchObject({ code: 422 });
	});
});

describe('actionErrorResponse', () => {
	describe('typed errors', () => {
		it('uses AccessError code and message', () => {
			const err = new AccessError(403, 'Forbidden');
			expect(actionErrorResponse(err, 'fallback', false)).toEqual({
				success: false,
				code: 403,
				errors: { _form: ['Forbidden'] },
			});
		});

		it('uses RepositoryError code and message when code < 500', () => {
			const err = new NoRecordFoundError('Topic');
			expect(actionErrorResponse(err, 'fallback', false)).toEqual({
				success: false,
				code: 404,
				errors: { _form: ['Topic not found'] },
			});
		});

		it('falls through to 500 for RepositoryError with code >= 500', () => {
			const err = new TooManyRecordsFoundError('Topic', 2, 1);
			expect(actionErrorResponse(err, 'Something went wrong', false)).toEqual({
				success: false,
				code: 500,
				errors: { _form: ['Something went wrong'] },
			});
		});
	});

	describe('verboseErrors: false', () => {
		it('returns 500 with fallback in _form', () => {
			expect(actionErrorResponse(new Error('db exploded'), 'Something went wrong', false)).toEqual({
				success: false,
				code: 500,
				errors: { _form: ['Something went wrong'] },
			});
		});
	});

	describe('verboseErrors: true', () => {
		it('returns the error message in _form', () => {
			const result = actionErrorResponse(new Error('internal detail'), 'fallback', true);
			expect(result).toMatchObject({ success: false, code: 500, errors: { _form: ['internal detail'] } });
		});

		it('walks the full cause chain into _form', () => {
			const cause = new Error('root cause');
			const err = new Error('outer error', { cause });
			expect(actionErrorResponse(err, 'fallback', true)).toEqual({
				success: false,
				code: 500,
				errors: { _form: ['outer error', 'root cause'] },
			});
		});

		it('includes non-Error leaf causes as strings', () => {
			const err = new Error('outer', { cause: 'raw string cause' });
			const result = actionErrorResponse(err, 'fallback', true);
			expect((result as { errors: Record<string, string[]> }).errors._form).toEqual(['outer', 'raw string cause']);
		});

		it('handles non-Error top-level values', () => {
			expect(actionErrorResponse('string error', 'fallback', true)).toEqual({
				success: false,
				code: 500,
				errors: { _form: ['string error'] },
			});
		});
	});
});

describe('toFormErrors', () => {
	it('returns undefined for a success state', () => {
		expect(toFormErrors(actionSuccessResponse({ id: 1 }))).toBeUndefined();
	});

	it('maps _form errors to the form key as a joined string', () => {
		const state = actionValidationError<unknown>({ _form: ['Something went wrong', 'Try again'] });
		expect(toFormErrors(state)).toMatchObject({ form: 'Something went wrong, Try again' });
	});

	it('omits the form key when there are no _form errors', () => {
		const state = actionValidationError<unknown>({ email: ['Email is required'] });
		expect(toFormErrors(state)).not.toHaveProperty('form');
	});

	it('maps field errors to single strings by joining', () => {
		const state = actionValidationError<unknown>({
			email: ['Email is required', 'Must be a valid email'],
			name: ['Name is too short'],
		});
		expect(toFormErrors(state)).toEqual({
			fields: {
				email: 'Email is required, Must be a valid email',
				name: 'Name is too short',
			},
		});
	});

	it('returns empty fields when only _form errors exist', () => {
		const state = actionValidationError<unknown>({ _form: ['Oops'] });
		expect(toFormErrors(state)).toEqual({ form: 'Oops', fields: {} });
	});

	it('handles both _form and field errors together', () => {
		const state = actionValidationError<unknown>({
			_form: ['Server error'],
			email: ['Email is taken'],
		});
		expect(toFormErrors(state)).toEqual({
			form: 'Server error',
			fields: { email: 'Email is taken' },
		});
	});
});
