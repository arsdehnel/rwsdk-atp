import { PasswordSession, type SessionData } from '@atproto/lex-password-session';
import type { PasswordClientEnv } from './types';

type DidDocument = {
	service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
};

async function resolvePdsFromDid(did: string, plcUrl?: string): Promise<string> {
	let didDocUrl: string;

	if (did.startsWith('did:plc:')) {
		const plc = plcUrl ?? 'https://plc.directory';
		didDocUrl = `${plc}/${did}`;
	} else if (did.startsWith('did:web:')) {
		// did:web:example.com → https://example.com/.well-known/did.json
		// did:web:localhost%3A3000 → https://localhost:3000/.well-known/did.json
		const domain = decodeURIComponent(did.slice('did:web:'.length));
		didDocUrl = `https://${domain}/.well-known/did.json`;
	} else {
		throw new Error(`Cannot resolve PDS for unsupported DID method: ${did}`);
	}

	const response = await fetch(didDocUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch DID document for ${did}: HTTP ${response.status}`);
	}

	const doc = (await response.json()) as DidDocument;
	const pdsService = doc.service?.find(s => s.id === '#atproto_pds');

	if (!pdsService?.serviceEndpoint) {
		throw new Error(`No atproto_pds service endpoint found in DID document for ${did}`);
	}

	return pdsService.serviceEndpoint;
}

export async function getPasswordClient(env: PasswordClientEnv): Promise<PasswordSession> {
	const doStub = await env.DO_ATP_AUTH.getByName(env.ATP_SERVICE_DID);

	const onUpdated = (data: SessionData): void => {
		void doStub.setPasswordToken(data as Record<string, unknown>);
	};
	const onDeleted = (): void => {
		void doStub.deletePasswordToken();
	};

	const stored = (await doStub.getPasswordToken()) as SessionData | undefined;
	if (stored) {
		return PasswordSession.resume(stored, { onUpdated, onDeleted });
	}

	const pdsUrl = await resolvePdsFromDid(env.ATP_SERVICE_DID, env.ATPROTO_PLC_URL_OVERRIDE);

	return PasswordSession.login({
		service: pdsUrl,
		identifier: env.ATP_SERVICE_DID,
		password: env.ATP_SERVICE_APP_PASSWORD,
		onUpdated,
		onDeleted,
	});
}
