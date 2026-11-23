import { describe, expect, it, vi } from 'vitest';
import { encrypt } from '../../crypto';

vi.mock('cloudflare:workers', () => ({
	DurableObject: class {
		protected ctx: unknown;
		protected env: unknown;
		constructor(ctx: unknown, env: unknown) {
			this.ctx = ctx;
			this.env = env;
		}
	},
}));

import { AtpOAuthDurableObject } from '../durable-object';

const KEY_RING_ONE = JSON.stringify(['test-key-one']);
const KEY_RING_TWO = JSON.stringify(['test-key-one', 'test-key-two']);

const makeStorage = (initialValue?: string) => {
	const map = new Map<string, string>();
	if (initialValue !== undefined) map.set('passwordTokenData', initialValue);
	return {
		get: vi.fn().mockImplementation((key: string) => Promise.resolve(map.get(key))),
		put: vi.fn().mockImplementation((key: string, value: string) => {
			map.set(key, value);
			return Promise.resolve();
		}),
		delete: vi.fn().mockImplementation((key: string) => {
			map.delete(key);
			return Promise.resolve();
		}),
	};
};

const makeDo = (initialStored?: string, keyRing = KEY_RING_ONE) => {
	const storage = makeStorage(initialStored);
	const ctx = {
		id: { toString: () => 'test-id', name: 'test-name' },
		storage,
	};
	const env = { OAUTH_TOKEN_KV_ENCRYPTION_KEYS: keyRing };
	const do_ = new AtpOAuthDurableObject(ctx as unknown as DurableObjectState, env as unknown as Cloudflare.Env);
	return { do_, storage };
};

const fakeData = { handle: 'test.bsky.social', accessJwt: 'token-abc' };

describe('AtpOAuthDurableObject password token methods', () => {
	describe('getPasswordToken', () => {
		it('returns undefined when nothing is stored', async () => {
			const { do_ } = makeDo();
			expect(await do_.getPasswordToken()).toBeUndefined();
		});

		it('decrypts and parses a stored token', async () => {
			const encrypted = await encrypt(JSON.stringify(fakeData), 'test-key-one');
			const { do_ } = makeDo(encrypted);
			expect(await do_.getPasswordToken()).toEqual(fakeData);
		});

		it('returns a value when the second key in the ring decrypts', async () => {
			const encrypted = await encrypt(JSON.stringify(fakeData), 'test-key-two');
			const { do_ } = makeDo(encrypted, KEY_RING_TWO);
			expect(await do_.getPasswordToken()).toEqual(fakeData);
		});

		it('re-encrypts with the first key when a later key decrypts', async () => {
			const encrypted = await encrypt(JSON.stringify(fakeData), 'test-key-two');
			const { do_, storage } = makeDo(encrypted, KEY_RING_TWO);
			await do_.getPasswordToken();
			expect(storage.put).toHaveBeenCalledOnce();
			expect(storage.put.mock.calls[0][0]).toBe('passwordTokenData');
		});

		it('does not re-encrypt when the first key decrypts', async () => {
			const encrypted = await encrypt(JSON.stringify(fakeData), 'test-key-one');
			const { do_, storage } = makeDo(encrypted, KEY_RING_TWO);
			await do_.getPasswordToken();
			expect(storage.put).not.toHaveBeenCalled();
		});

		it('throws when no key in the ring can decrypt', async () => {
			const encrypted = await encrypt(JSON.stringify(fakeData), 'completely-different-key');
			const { do_ } = makeDo(encrypted);
			await expect(do_.getPasswordToken()).rejects.toThrow('Password token decryption failed, no more keys to try');
		});
	});

	describe('setPasswordToken', () => {
		it('stores under the passwordTokenData key', async () => {
			const { do_, storage } = makeDo();
			await do_.setPasswordToken(fakeData);
			expect(storage.put.mock.calls[0][0]).toBe('passwordTokenData');
		});

		it('does not store plaintext', async () => {
			const { do_, storage } = makeDo();
			await do_.setPasswordToken(fakeData);
			const stored = storage.put.mock.calls[0][1] as string;
			expect(stored).not.toContain('token-abc');
		});

		it('round-trips: stored value decrypts back to the original data', async () => {
			const { do_ } = makeDo();
			await do_.setPasswordToken(fakeData);
			expect(await do_.getPasswordToken()).toEqual(fakeData);
		});
	});

	describe('deletePasswordToken', () => {
		it('calls storage.delete with the passwordTokenData key', async () => {
			const encrypted = await encrypt(JSON.stringify(fakeData), 'test-key-one');
			const { do_, storage } = makeDo(encrypted);
			await do_.deletePasswordToken();
			expect(storage.delete).toHaveBeenCalledWith('passwordTokenData');
		});

		it('token is gone after delete', async () => {
			const { do_ } = makeDo();
			await do_.setPasswordToken(fakeData);
			await do_.deletePasswordToken();
			expect(await do_.getPasswordToken()).toBeUndefined();
		});
	});
});
