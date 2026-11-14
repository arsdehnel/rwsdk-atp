# Error Classes

`rwsdk-atp/errors` provides three error classes for different failure contexts: `AccessError` for authorization failures, the `RepositoryError` family for data-layer failures, and `StepError` for Cloudflare Workflow steps.

## `AccessError`

Signals that the caller is not permitted to perform an operation. Carry the HTTP status code alongside the message so the API layer can respond correctly without needing to inspect the message string.

```ts
import { AccessError } from 'rwsdk-atp/errors';

throw new AccessError(403, 'You do not have permission to delete this resource');
throw new AccessError(401, 'Authentication required');
```

| Argument  | Type     | Description                           |
| --------- | -------- | ------------------------------------- |
| `code`    | `number` | HTTP status code (typically 401, 403) |
| `message` | `string` | Human-readable error message          |

## Repository errors

The repository layer throws typed errors that carry an HTTP status code, so the API layer can convert them to responses without a switch statement.

All repository error classes extend the abstract `RepositoryError` base, so you can catch any of them with a single `instanceof RepositoryError` check while still being able to target specific types when needed.

### `NoRecordFoundError`

A query returned no rows when at least one was expected. Default code is `404`.

```ts
import { NoRecordFoundError } from 'rwsdk-atp/errors';

throw new NoRecordFoundError('Stance');
// message: "Stance not found"
// code: 404
```

Pass a second argument to override the code. Use this when a missing row indicates an infrastructure failure rather than a user-facing 404 — for example, when `.returning()` on an upsert comes back empty:

```ts
throw new NoRecordFoundError('User', 500);
```

| Argument | Type     | Default | Description                               |
| -------- | -------- | ------- | ----------------------------------------- |
| `entity` | `string` | —       | Name of the record type (e.g. `'Stance'`) |
| `code`   | `number` | `404`   | HTTP status code override                 |

### `TooManyRecordsFoundError`

A query returned more rows than expected. Always `500` — this indicates a data integrity problem.

```ts
import { TooManyRecordsFoundError } from 'rwsdk-atp/errors';

throw new TooManyRecordsFoundError('Stance', rows.length, 1);
// message: "Stance expected 1, got 3"
// code: 500
```

| Argument   | Type     | Description             |
| ---------- | -------- | ----------------------- |
| `entity`   | `string` | Name of the record type |
| `actual`   | `number` | Number of rows returned |
| `expected` | `number` | Number of rows expected |

### `InvalidUUIDError`

A value that should be a UUID failed validation — typically caught before hitting the database. Always `400`.

```ts
import { InvalidUUIDError } from 'rwsdk-atp/errors';

if (!validateUuid(id)) {
	throw new InvalidUUIDError(id, 'ApiKey');
}
// message: 'The value "abc" is not a valid ID for a ApiKey'
// code: 400
```

| Argument | Type     | Description                             |
| -------- | -------- | --------------------------------------- |
| `value`  | `string` | The invalid value that was provided     |
| `entity` | `string` | Name of the record type being looked up |

### `InvalidDIDError`

A value that should be an AT Protocol DID failed validation. Always `400`.

```ts
import { InvalidDIDError } from 'rwsdk-atp/errors';

if (!isValidDid(did)) {
	throw new InvalidDIDError(did, 'User');
}
// message: 'The value "not-a-did" is not a valid DID for a User'
// code: 400
```

| Argument | Type     | Description                             |
| -------- | -------- | --------------------------------------- |
| `value`  | `string` | The invalid DID that was provided       |
| `entity` | `string` | Name of the record type being looked up |

## `StepError`

For Cloudflare Workflow steps. Separates the message you show users from the detail you log internally, and signals whether the step should be retried.

```ts
import { StepError } from 'rwsdk-atp/errors';

throw new StepError(
	503,
	'Service temporarily unavailable',
	`External API returned 429 after 3 retries: ${url}`,
	true, // retryable
);
```

| Argument        | Type      | Default | Description                                         |
| --------------- | --------- | ------- | --------------------------------------------------- |
| `code`          | `number`  | —       | HTTP status code                                    |
| `publicMessage` | `string`  | —       | Safe message for end users                          |
| `devMessage`    | `string`  | —       | Full detail for logs and developers (`err.message`) |
| `retryable`     | `boolean` | `false` | Whether the Workflow step should be retried         |
| `cause`         | `unknown` | —       | Underlying error, attached as `err.cause`           |

## Catching errors

`rwsdk-atp/response` provides `apiErrorResponse` and `actionErrorResponse` that handle this translation automatically — see the [Response Helpers](./response) guide for details.

If you need to catch errors manually, all three classes carry a `code` so a single catch block can determine the right HTTP status without inspecting the message:

```ts
import { AccessError, RepositoryError } from 'rwsdk-atp/errors';

try {
    const stance = await getStanceById(id, logger);
    return Response.json({ success: true, data: stance });
} catch (err) {
    if (err instanceof AccessError) {
        return Response.json({ success: false, error: err.message }, { status: err.code });
    }
    if (err instanceof RepositoryError && err.code < 500) {
        return Response.json({ success: false, error: err.message }, { status: err.code });
    }
    // unexpected error — log it, return a safe message
    logger.error('Unexpected error fetching stance', { err });
    return Response.json({ success: false, error: 'Failed to fetch stance' }, { status: 500 });
}
```

The `RepositoryError` check gates on `code < 500` so that `TooManyRecordsFoundError` (a data integrity problem) falls through to the unexpected-error branch rather than surfacing its internal message to callers.
