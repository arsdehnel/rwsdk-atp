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

import { getPasswordClient } from '../password-client';

const makeDoStub = (storedToken?: Record<string, unknown>) => ({
	getPasswordToken: vi.fn().mockResolvedValue(storedToken),
	setPasswordToken: vi.fn().mockResolvedValue(undefined),
	deletePasswordToken: vi.fn().mockResolvedValue(undefined),
});

const makeEnv = (stub = makeDoStub()) => ({
	stub,
	env: {
		DO_ATP_AUTH: {
			getByName: vi.fn().mockResolvedValue(stub),
		} as unknown as DurableObjectNamespace<any>,
		ATP_SERVICE_DID: 'did:plc:service',
		ATP_SERVICE_APP_PASSWORD: 'app-password-xyz',
		ATPROTO_PDS_URL: 'https://bsky.social',
	},
});

const fakeSession = { session: 'fake-session-object' };

describe('getPasswordClient', () => {
	it('calls getByName with the did', async () => {
		const { env } = makeEnv();
		mockLogin.mockResolvedValue(fakeSession);
		await getPasswordClient(env);
		expect(env.DO_ATP_AUTH.getByName).toHaveBeenCalledWith('did:plc:service');
	});

	it('calls PasswordSession.login when no token is stored', async () => {
		const { env } = makeEnv();
		mockLogin.mockResolvedValue(fakeSession);
		const result = await getPasswordClient(env);
		expect(mockLogin).toHaveBeenCalled();
		expect(mockResume).not.toHaveBeenCalled();
		expect(result).toBe(fakeSession);
	});

	it('calls PasswordSession.resume when a stored token exists', async () => {
		const stored = { accessJwt: 'stored-token' };
		const { env } = makeEnv(makeDoStub(stored));
		mockResume.mockResolvedValue(fakeSession);
		const result = await getPasswordClient(env);
		expect(mockResume).toHaveBeenCalled();
		expect(mockLogin).not.toHaveBeenCalled();
		expect(result).toBe(fakeSession);
	});

	it('passes login options to PasswordSession.login', async () => {
		const { env } = makeEnv();
		mockLogin.mockResolvedValue(fakeSession);
		await getPasswordClient(env);
		expect(mockLogin).toHaveBeenCalledWith(
			expect.objectContaining({
				service: 'https://bsky.social',
				identifier: 'did:plc:service',
				password: 'app-password-xyz',
			}),
		);
	});

	it('passes stored token to PasswordSession.resume', async () => {
		const stored = { accessJwt: 'my-token' };
		const { env } = makeEnv(makeDoStub(stored));
		mockResume.mockResolvedValue(fakeSession);
		await getPasswordClient(env);
		expect(mockResume).toHaveBeenCalledWith(stored, expect.any(Object));
	});

	it('onUpdated callback calls setPasswordToken on the DO stub', async () => {
		const { stub, env } = makeEnv();
		let capturedOnUpdated: ((data: Record<string, unknown>) => void) | undefined;
		mockLogin.mockImplementation((opts: { onUpdated: (data: Record<string, unknown>) => void }) => {
			capturedOnUpdated = opts.onUpdated;
			return Promise.resolve(fakeSession);
		});
		await getPasswordClient(env);

		const updateData = { accessJwt: 'refreshed-token' };
		if (!capturedOnUpdated) throw new Error('onUpdated was not captured by mockLogin');
		capturedOnUpdated(updateData);
		await Promise.resolve(); // let the void promise settle
		expect(stub.setPasswordToken).toHaveBeenCalledWith(updateData);
	});

	it('onDeleted callback calls deletePasswordToken on the DO stub', async () => {
		const { stub, env } = makeEnv();
		let capturedOnDeleted: (() => void) | undefined;
		mockLogin.mockImplementation((opts: { onDeleted: () => void }) => {
			capturedOnDeleted = opts.onDeleted;
			return Promise.resolve(fakeSession);
		});
		await getPasswordClient(env);

		if (!capturedOnDeleted) throw new Error('onDeleted was not captured by mockLogin');
		capturedOnDeleted();
		await Promise.resolve();
		expect(stub.deletePasswordToken).toHaveBeenCalledOnce();
	});
});
