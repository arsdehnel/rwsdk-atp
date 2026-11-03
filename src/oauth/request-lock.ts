import type { RuntimeLock } from '@atproto/oauth-client-node';
import type { OAuthTokenDurableObject } from './durable-object';

type Awaitable<T> = T | PromiseLike<T>;

export function requestLock(doAuthTokenBinding: DurableObjectNamespace<OAuthTokenDurableObject>): RuntimeLock {
	return async <T>(did: string, fn: () => Awaitable<T>): Promise<T> => {
		const doStub = await doAuthTokenBinding.getByName(did);
		await doStub.acquireLock();
		try {
			return await fn();
		} finally {
			await doStub.releaseLock();
		}
	};
}
