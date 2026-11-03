import type { NodeSavedState, NodeSavedStateStore } from '@atproto/oauth-client-node';
import { decrypt, encrypt, parseKeyRing } from '../crypto';

export function stateStore(kvOauthState: KVNamespace, oauthStateEncryptionKeys: string): NodeSavedStateStore {
	return {
		async get(key: string): Promise<NodeSavedState | undefined> {
			const raw = await kvOauthState.get(key);
			if (!raw) return undefined;
			const keys = parseKeyRing(oauthStateEncryptionKeys);
			for (let i = 0; i < keys.length; i++) {
				try {
					const plaintext = await decrypt(raw, keys[i]);
					return JSON.parse(plaintext) as NodeSavedState;
				} catch {
					if (i === keys.length - 1) throw new Error(`Token could not be decrypted`);
				}
			}
		},
		async set(key: string, value: NodeSavedState): Promise<void> {
			const keys = parseKeyRing(oauthStateEncryptionKeys);
			const encrypted = await encrypt(JSON.stringify(value), keys[0]);
			await kvOauthState.put(key, encrypted, {
				expirationTtl: 600, // 10 minutes
			});
		},
		async del(key: string): Promise<void> {
			await kvOauthState.delete(key);
		},
	};
}
