import { createSessionSignature } from './create-session-signature';
import { unpackSessionId } from './unpack-session-id';

export async function isValidSessionId(browserSessionSigningKey: string, signedSessionId: string): Promise<boolean> {
	try {
		const { unsignedSessionId, signature } = unpackSessionId(signedSessionId);
		const computedSignature = await createSessionSignature(browserSessionSigningKey, unsignedSessionId);
		return computedSignature === signature;
	} catch {
		return false;
	}
}
