import type { NodeSavedState } from '@atproto/oauth-client-node';
import { describe, expect, it, vi } from 'vitest';
import { encrypt } from '../../crypto';
import { stateStore } from '../state-store';

const KEY_RING = JSON.stringify(['test-key-one']);
const KEY_RING_TWO = JSON.stringify(['test-key-one', 'test-key-two']);

const fakeState = { state: 'abc123', iss: 'https://bsky.social' } as unknown as NodeSavedState;

const makeKv = (storedValue: string | null = null) => ({
	get: vi.fn().mockResolvedValue(storedValue),
	put: vi.fn().mockResolvedValue(undefined),
	delete: vi.fn().mockResolvedValue(undefined),
});

describe('stateStore', () => {
	describe('get', () => {
		it('returns undefined when KV has no entry for the key', async () => {
			const kv = makeKv(null);
			const store = stateStore(kv as unknown as KVNamespace, KEY_RING);
			const result = await store.get('state-key');
			expect(result).toBeUndefined();
		});

		it('decrypts and parses a valid stored value', async () => {
			const encrypted = await encrypt(JSON.stringify(fakeState), 'test-key-one');
			const kv = makeKv(encrypted);
			const store = stateStore(kv as unknown as KVNamespace, KEY_RING);
			const result = await store.get('state-key');
			expect(result).toEqual(fakeState);
		});

		it('returns a value when the first key in the ring fails but the second succeeds', async () => {
			// encrypt with key-two (second in ring); key-one will fail
			const encrypted = await encrypt(JSON.stringify(fakeState), 'test-key-two');
			const kv = makeKv(encrypted);
			const store = stateStore(kv as unknown as KVNamespace, KEY_RING_TWO);
			const result = await store.get('state-key');
			expect(result).toEqual(fakeState);
		});

		it('throws when no key in the ring can decrypt the value', async () => {
			const encrypted = await encrypt(JSON.stringify(fakeState), 'completely-different-key');
			const kv = makeKv(encrypted);
			const store = stateStore(kv as unknown as KVNamespace, KEY_RING);
			await expect(store.get('state-key')).rejects.toThrow('Token could not be decrypted');
		});
	});

	describe('set', () => {
		it('stores an encrypted value (not plaintext JSON)', async () => {
			const kv = makeKv();
			const store = stateStore(kv as unknown as KVNamespace, KEY_RING);
			await store.set('state-key', fakeState);
			const storedValue = kv.put.mock.calls[0][1] as string;
			expect(storedValue).not.toContain('abc123');
		});

		it('stores with a 10-minute TTL', async () => {
			const kv = makeKv();
			const store = stateStore(kv as unknown as KVNamespace, KEY_RING);
			await store.set('state-key', fakeState);
			const opts = kv.put.mock.calls[0][2];
			expect(opts).toEqual({ expirationTtl: 600 });
		});

		it('stores under the correct KV key', async () => {
			const kv = makeKv();
			const store = stateStore(kv as unknown as KVNamespace, KEY_RING);
			await store.set('my-state-key', fakeState);
			expect(kv.put.mock.calls[0][0]).toBe('my-state-key');
		});

		it('round-trips: a value stored then retrieved is identical', async () => {
			let stored: string | null = null;
			const kv = {
				get: vi.fn().mockImplementation(() => Promise.resolve(stored)),
				put: vi.fn().mockImplementation((_key: string, value: string) => {
					stored = value;
					return Promise.resolve();
				}),
				delete: vi.fn(),
			};
			const store = stateStore(kv as unknown as KVNamespace, KEY_RING);
			await store.set('state-key', fakeState);
			const result = await store.get('state-key');
			expect(result).toEqual(fakeState);
		});
	});

	describe('del', () => {
		it('calls KV delete with the correct key', async () => {
			const kv = makeKv();
			const store = stateStore(kv as unknown as KVNamespace, KEY_RING);
			await store.del('state-key');
			expect(kv.delete).toHaveBeenCalledWith('state-key');
		});
	});
});
