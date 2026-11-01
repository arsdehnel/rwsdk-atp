const arrayBufferToHex = (buffer: ArrayBuffer): string => {
	const array = new Uint8Array(buffer);
	return Array.from(array)
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
};

export async function createSessionSignature(browserSessionSigningKey: string, unsignedSessionId: string): Promise<string> {
	const encoder = new TextEncoder();

	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(browserSessionSigningKey),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);

	const signatureArrayBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(unsignedSessionId));

	return arrayBufferToHex(signatureArrayBuffer);
}
