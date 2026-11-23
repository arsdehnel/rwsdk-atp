import { describe, expect, it, vi } from 'vitest';

const { mockLogin, mockResume } = vi.hoisted(() => ({
	mockLogin: vi.fn(),
	mockResume: vi.fn(),
}));

vi.mock('@atproto/lex-password-session', () => ({
	PasswordSession: {
		login: mockLogin,
		resume: mockResume,
	},
}));

import { getPasswordSession } from '../password-client';

const loginOptions = {
	service: 'https://bsky.social',
	identifier: 'did:plc:service',
	password: 'app-password-xyz',
};

const makeDoStub = (storedToken?: Record<string, unknown>) => ({
	getPasswordToken: vi.fn().mockResolvedValue(storedToken),
	setPasswordToken: vi.fn().mockResolvedValue(undefined),
	deletePasswordToken: vi.fn().mockResolvedValue(undefined),
});

const makeNamespace = (stub = makeDoStub()) => ({
	stub,
	namespace: {
		getByName: vi.fn().mockResolvedValue(stub),
	} as unknown as DurableObjectNamespace<unknown>,
});

const fakeSession = { session: 'fake-session-object' };

describe('getPasswordSession', () => {
	it('calls getByName with the did', async () => {
		const { namespace } = makeNamespace();
		mockLogin.mockResolvedValue(fakeSession);
		await getPasswordSession(namespace, 'did:plc:service', loginOptions);
		expect(namespace.getByName).toHaveBeenCalledWith('did:plc:service');
	});

	it('calls PasswordSession.login when no token is stored', async () => {
		const { namespace } = makeNamespace();
		mockLogin.mockResolvedValue(fakeSession);
		const result = await getPasswordSession(namespace, 'did:plc:service', loginOptions);
		expect(mockLogin).toHaveBeenCalled();
		expect(mockResume).not.toHaveBeenCalled();
		expect(result).toBe(fakeSession);
	});

	it('calls PasswordSession.resume when a stored token exists', async () => {
		const stored = { accessJwt: 'stored-token' };
		const { namespace } = makeNamespace(makeDoStub(stored));
		mockResume.mockResolvedValue(fakeSession);
		const result = await getPasswordSession(namespace, 'did:plc:service', loginOptions);
		expect(mockResume).toHaveBeenCalled();
		expect(mockLogin).not.toHaveBeenCalled();
		expect(result).toBe(fakeSession);
	});

	it('passes login options to PasswordSession.login', async () => {
		const { namespace } = makeNamespace();
		mockLogin.mockResolvedValue(fakeSession);
		await getPasswordSession(namespace, 'did:plc:service', loginOptions);
		expect(mockLogin).toHaveBeenCalledWith(expect.objectContaining(loginOptions));
	});

	it('passes stored token to PasswordSession.resume', async () => {
		const stored = { accessJwt: 'my-token' };
		const { namespace } = makeNamespace(makeDoStub(stored));
		mockResume.mockResolvedValue(fakeSession);
		await getPasswordSession(namespace, 'did:plc:service', loginOptions);
		expect(mockResume).toHaveBeenCalledWith(stored, expect.any(Object));
	});

	it('onUpdated callback calls setPasswordToken on the DO stub', async () => {
		const { stub, namespace } = makeNamespace();
		let capturedOnUpdated: ((data: Record<string, unknown>) => void) | undefined;
		mockLogin.mockImplementation((opts: { onUpdated: (data: Record<string, unknown>) => void }) => {
			capturedOnUpdated = opts.onUpdated;
			return Promise.resolve(fakeSession);
		});
		await getPasswordSession(namespace, 'did:plc:service', loginOptions);

		const updateData = { accessJwt: 'refreshed-token' };
		capturedOnUpdated!(updateData);
		await Promise.resolve(); // let the void promise settle
		expect(stub.setPasswordToken).toHaveBeenCalledWith(updateData);
	});

	it('onDeleted callback calls deletePasswordToken on the DO stub', async () => {
		const { stub, namespace } = makeNamespace();
		let capturedOnDeleted: (() => void) | undefined;
		mockLogin.mockImplementation((opts: { onDeleted: () => void }) => {
			capturedOnDeleted = opts.onDeleted;
			return Promise.resolve(fakeSession);
		});
		await getPasswordSession(namespace, 'did:plc:service', loginOptions);

		capturedOnDeleted!();
		await Promise.resolve();
		expect(stub.deletePasswordToken).toHaveBeenCalledOnce();
	});
});
