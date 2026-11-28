import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const TEST_DID = 'did:plc:service123';
const TEST_PDS_URL = 'https://bsky.social';

function makeDidDocResponse(pdsUrl = TEST_PDS_URL) {
	return {
		ok: true,
		status: 200,
		json: vi.fn().mockResolvedValue({
			service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: pdsUrl }],
		}),
	};
}

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
		ATP_SERVICE_DID: TEST_DID,
		ATP_SERVICE_APP_PASSWORD: 'app-password-xyz',
	},
});

const fakeSession = { session: 'fake-session-object' };

let fetchMock: ReturnType<typeof vi.fn>;

describe('getPasswordClient', () => {
	beforeEach(() => {
		fetchMock = vi.fn().mockResolvedValue(makeDidDocResponse());
		vi.stubGlobal('fetch', fetchMock);
		mockLogin.mockReset();
		mockResume.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('calls getByName with the did', async () => {
		const { env } = makeEnv();
		mockLogin.mockResolvedValue(fakeSession);
		await getPasswordClient(env);
		expect(env.DO_ATP_AUTH.getByName).toHaveBeenCalledWith(TEST_DID);
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

	it('resolves the PDS URL from the DID document and passes it to login', async () => {
		const { env } = makeEnv();
		mockLogin.mockResolvedValue(fakeSession);
		await getPasswordClient(env);
		expect(mockLogin).toHaveBeenCalledWith(
			expect.objectContaining({
				service: TEST_PDS_URL,
				identifier: TEST_DID,
				password: 'app-password-xyz',
			}),
		);
	});

	it('fetches the DID document from plc.directory by default', async () => {
		const { env } = makeEnv();
		mockLogin.mockResolvedValue(fakeSession);
		await getPasswordClient(env);
		expect(fetchMock).toHaveBeenCalledWith(`https://plc.directory/${TEST_DID}`);
	});

	it('uses ATPROTO_PLC_URL_OVERRIDE when fetching the DID document', async () => {
		const { env } = makeEnv();
		fetchMock.mockResolvedValue(makeDidDocResponse('http://localhost:3000'));
		mockLogin.mockResolvedValue(fakeSession);
		await getPasswordClient({ ...env, ATPROTO_PLC_URL_OVERRIDE: 'http://localhost:2582' });
		expect(fetchMock).toHaveBeenCalledWith(`http://localhost:2582/${TEST_DID}`);
	});

	it('does not fetch the DID document when a stored session is resumed', async () => {
		const stored = { accessJwt: 'stored-token' };
		const { env } = makeEnv(makeDoStub(stored));
		mockResume.mockResolvedValue(fakeSession);
		await getPasswordClient(env);
		expect(fetchMock).not.toHaveBeenCalled();
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
