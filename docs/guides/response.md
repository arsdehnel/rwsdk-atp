# Response Helpers

`rwsdk-atp/response` exports helpers for consistent HTTP responses and server action state. Two target JSON API routes, two target server actions, and one formats action state for form libraries.

## `ApiResponse<T>`

The response body type for JSON API routes. A discriminated union on `errors`:

```ts
type ApiResponse<T> = { data: T; errors?: never } | { data?: never; errors: string[] | Record<string, string[]> };
```

Success responses carry `data`. Error responses carry `errors` — a `string[]` for generic errors or a `Record<string, string[]>` for field-level validation errors keyed by field name.

Narrow on `errors` to get TypeScript to narrow the type:

```ts
const body = await res.json() as ApiResponse<Stance>;

if (!body.errors) {
	return body.data; // Stance
}
// body.errors: string[] | Record<string, string[]>
```

If you just need all messages regardless of shape, flatten them:

```ts
function getErrorMessages(errors: string[] | Record<string, string[]>): string[] {
	return Array.isArray(errors) ? errors : Object.values(errors).flat();
}
```

For field-level validation errors (from Zod), the keys are dot-joined field paths — `'color'`, `'address.street'` — and the special key `'_form'` holds errors that have no path.

## `ActionState<T>`

The shared return type for all action helpers. A discriminated union that the form layer can inspect:

```ts
type ActionState<T> =
	| { success: true; code: number; data: T }
	| { success: false; code: number; errors: Record<string, string[]> };
```

`errors` is a map of field names to arrays of messages. The special key `_form` is used for non-field errors that apply to the form as a whole.

## API helpers

These return a `Response` and are for use in HTTP route handlers.

### `apiSuccessResponse`

```ts
apiSuccessResponse<T>(data: T, status = 200): Response
```

Returns `{ data }`:

```ts
import { apiSuccessResponse } from '@arsdehnel/rwsdk-atp/response';

return apiSuccessResponse(stance);        // 200
return apiSuccessResponse(stance, 201);   // 201 Created
```

### `apiErrorResponse`

```ts
apiErrorResponse(err: unknown, fallbackMessage: string, verboseErrors: boolean): Response
```

Converts a caught error to a `Response`. Typed errors are surfaced directly; everything else is masked behind `fallbackMessage` unless `verboseErrors` is true.

| Error type                           | `verboseErrors` | Status     | `errors`                                       |
| ------------------------------------ | --------------- | ---------- | ---------------------------------------------- |
| Zod-like (has `issues`)              | either          | 400        | `Record<string, string[]>` keyed by field path |
| `AccessError`                        | either          | `err.code` | `[err.message]`                                |
| `RepositoryError` with `code < 500`  | either          | `err.code` | `[err.message]`                                |
| `RepositoryError` with `code >= 500` | `false`         | 500        | `[fallbackMessage]`                            |
| `RepositoryError` with `code >= 500` | `true`          | 500        | full cause chain                               |
| Other `Error`                        | `false`         | 500        | `[fallbackMessage]`                            |
| Other `Error`                        | `true`          | 500        | full cause chain                               |

"Full cause chain" means `[err.message, cause.message, ...]` — all messages from the error and its cause chain flattened into the array.

Pass `verboseErrors` based on your environment — `import.meta.env.DEV` is a typical choice. Rather than threading it through every call site, wrap it once at the application layer:

```ts
// src/api/utils.ts
import { apiErrorResponse as _apiErrorResponse } from '@arsdehnel/rwsdk-atp/response';

export function apiErrorResponse(err: unknown, fallbackMessage = 'An error occurred'): Response {
	return _apiErrorResponse(err, fallbackMessage, import.meta.env.DEV);
}
```

## Action helpers

These return `ActionState<T>` and are for use in server actions where the form layer expects structured error state.

### `actionSuccessResponse`

```ts
actionSuccessResponse<T>(data: T, status = 200): ActionState<T>
```

```ts
import { actionSuccessResponse } from '@arsdehnel/rwsdk-atp/response';

return actionSuccessResponse(result);
```

### `actionValidationError`

```ts
actionValidationError<T>(errors: Record<string, string[]>, status = 400): ActionState<T>
```

For Zod or other field-level validation failures. The error map is passed through directly — validation errors are user-caused and always safe to display, so there is no `verboseErrors` parameter here.

```ts
import { actionValidationError } from '@arsdehnel/rwsdk-atp/response';

const result = schema.safeParse(input);
if (!result.success) {
	return actionValidationError(result.error.flatten().fieldErrors);
}
```

### `actionErrorResponse`

```ts
actionErrorResponse<T>(err: unknown, fallbackMessage: string, verboseErrors: boolean): ActionState<T>
```

For unexpected errors caught in action handlers. Follows the same `verboseErrors` logic as `apiErrorResponse`, but puts the message(s) into `errors._form`. When verbose, the full cause chain is spread across `_form` as individual entries rather than joined into one string — the UI can then render them however it needs.

```ts
import { actionErrorResponse } from '@arsdehnel/rwsdk-atp/response';

try {
	// ...
} catch (err) {
	return actionErrorResponse(err, 'Failed to save changes', import.meta.env.DEV);
}
```

## `toFormErrors`

```ts
toFormErrors<T>(state: ActionState<T>): { form?: string; fields: Record<string, string> } | undefined
```

Converts an `ActionState` into the shape TanStack Form expects from an `onSubmitAsync` validator. Returns `undefined` on success (no errors to set), or an object with `form` for form-level errors and `fields` for field-level errors. Multiple messages per field are joined with `', '`.

```ts
import { toFormErrors } from '@arsdehnel/rwsdk-atp/response';

const form = useAppForm({
	validators: {
		onSubmitAsync: async ({ value }) => {
			const result = await saveRecipe(value);
			return toFormErrors(result);
		},
	},
});
```

This routes server errors through TanStack Form's internal error state, so field errors appear alongside client-side validation errors in `<FieldError />` components, and form-level errors are available via `form.state.errorMap.onSubmit.form`.
