export function parseKeyRing(raw: string | undefined): string[] {
	if (raw === undefined) throw new Error('Encryption key ring secret is not configured');
	const keys = JSON.parse(raw) as string[];
	if (!Array.isArray(keys) || keys.length === 0) {
		throw new Error('Encryption key ring must be a non-empty JSON array');
	}
	return keys;
}
