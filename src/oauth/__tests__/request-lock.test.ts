import { describe, expect, it, vi } from 'vitest';
import { requestLock } from '../request-lock';

const makeDoStub = () => ({
	acquireLock: vi.fn().mockResolvedValue(undefined),
	releaseLock: vi.fn().mockResolvedValue(undefined),
});

const makeNamespace = (stub = makeDoStub()) => ({
	stub,
	namespace: {
		getByName: vi.fn().mockResolvedValue(stub),
	} as unknown as DurableObjectNamespace<any>,
});

describe('requestLock', () => {
	it('calls getByName with the did', async () => {
		const { stub: _stub, namespace } = makeNamespace();
		const lock = requestLock(namespace);
		await lock('did:plc:test', vi.fn().mockResolvedValue(undefined));
		expect(namespace.getByName).toHaveBeenCalledWith('did:plc:test');
	});

	it('calls acquireLock before invoking fn', async () => {
		const stub = makeDoStub();
		const { namespace } = makeNamespace(stub);
		const order: string[] = [];
		stub.acquireLock.mockImplementation(async () => {
			order.push('acquire');
		});
		const fn = vi.fn().mockImplementation(async () => {
			order.push('fn');
		});

		const lock = requestLock(namespace);
		await lock('did:plc:test', fn);

		expect(order[0]).toBe('acquire');
		expect(order[1]).toBe('fn');
	});

	it('calls releaseLock after fn completes', async () => {
		const stub = makeDoStub();
		const { namespace } = makeNamespace(stub);
		const order: string[] = [];
		const fn = vi.fn().mockImplementation(async () => {
			order.push('fn');
		});
		stub.releaseLock.mockImplementation(async () => {
			order.push('release');
		});

		const lock = requestLock(namespace);
		await lock('did:plc:test', fn);

		expect(order[0]).toBe('fn');
		expect(order[1]).toBe('release');
	});

	it('returns the value from fn', async () => {
		const { namespace } = makeNamespace();
		const lock = requestLock(namespace);
		const result = await lock('did:plc:test', async () => 'hello');
		expect(result).toBe('hello');
	});

	it('releases the lock even when fn throws', async () => {
		const stub = makeDoStub();
		const { namespace } = makeNamespace(stub);
		const lock = requestLock(namespace);

		await expect(
			lock('did:plc:test', async () => {
				throw new Error('fn blew up');
			}),
		).rejects.toThrow('fn blew up');

		expect(stub.releaseLock).toHaveBeenCalledOnce();
	});

	it('propagates the error from fn after releasing the lock', async () => {
		const stub = makeDoStub();
		const { namespace } = makeNamespace(stub);
		const lock = requestLock(namespace);
		const err = new Error('something went wrong');

		await expect(lock('did:plc:test', async () => Promise.reject(err))).rejects.toBe(err);
		expect(stub.releaseLock).toHaveBeenCalledOnce();
	});
});
