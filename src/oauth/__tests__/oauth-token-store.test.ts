import type { NodeSavedSession } from '@atproto/oauth-client-node';
import { describe, expect, it, vi } from 'vitest';
import { tokenStore } from '../oauth-token-store';

const makeDoStub = (token?: NodeSavedSession) => ({
	getToken: vi.fn().mockResolvedValue(token),
	setToken: vi.fn().mockResolvedValue(undefined),
	deleteToken: vi.fn().mockResolvedValue(undefined),
});

const makeNamespace = (stub = makeDoStub()) => ({
	stub,
	namespace: {
		getByName: vi.fn().mockResolvedValue(stub),
	} as unknown as DurableObjectNamespace<any>,
});

const fakeSession = { tokenSet: {} } as unknown as NodeSavedSession;

describe('tokenStore', () => {
	describe('get', () => {
		it('calls getByName with the did', async () => {
			const { namespace } = makeNamespace();
			const store = tokenStore(namespace);
			await store.get('did:plc:user');
			expect(namespace.getByName).toHaveBeenCalledWith('did:plc:user');
		});

		it('returns the token from the DO stub', async () => {
			const { namespace } = makeNamespace(makeDoStub(fakeSession));
			const store = tokenStore(namespace);
			const result = await store.get('did:plc:user');
			expect(result).toBe(fakeSession);
		});

		it('returns undefined when the DO stub returns undefined', async () => {
			const { namespace } = makeNamespace(makeDoStub(undefined));
			const store = tokenStore(namespace);
			const result = await store.get('did:plc:user');
			expect(result).toBeUndefined();
		});
	});

	describe('set', () => {
		it('calls getByName with the did', async () => {
			const { namespace } = makeNamespace();
			const store = tokenStore(namespace);
			await store.set('did:plc:user', fakeSession);
			expect(namespace.getByName).toHaveBeenCalledWith('did:plc:user');
		});

		it('passes the session value to setToken', async () => {
			const { stub, namespace } = makeNamespace();
			const store = tokenStore(namespace);
			await store.set('did:plc:user', fakeSession);
			expect(stub.setToken).toHaveBeenCalledWith(fakeSession);
		});
	});

	describe('del', () => {
		it('calls getByName with the did', async () => {
			const { namespace } = makeNamespace();
			const store = tokenStore(namespace);
			await store.del('did:plc:user');
			expect(namespace.getByName).toHaveBeenCalledWith('did:plc:user');
		});

		it('calls deleteToken on the DO stub', async () => {
			const { stub, namespace } = makeNamespace();
			const store = tokenStore(namespace);
			await store.del('did:plc:user');
			expect(stub.deleteToken).toHaveBeenCalledOnce();
		});
	});
});
