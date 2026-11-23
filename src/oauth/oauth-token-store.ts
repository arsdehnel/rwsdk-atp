import type { NodeSavedSession, NodeSavedSessionStore } from '@atproto/oauth-client-node';
import type { AtpOAuthDurableObject } from './durable-object';

export function tokenStore(tokenDOBinding: DurableObjectNamespace<AtpOAuthDurableObject>): NodeSavedSessionStore {
	return {
		async get(did: string): Promise<NodeSavedSession | undefined> {
			const doStub = await tokenDOBinding.getByName(did);
			return await doStub.getToken();
		},
		async set(did: string, value: NodeSavedSession): Promise<void> {
			const doStub = await tokenDOBinding.getByName(did);
			await doStub.setToken(value);
		},
		async del(did: string): Promise<void> {
			const doStub = await tokenDOBinding.getByName(did);
			await doStub.deleteToken();
		},
	};
}
