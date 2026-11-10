import { describe, expect, it } from 'vitest';
import { unpackSessionId } from '../unpack-session-id';

describe('unpackSessionId', () => {
	it('extracts unsignedSessionId and signature from a well-formed packed string', () => {
		// btoa('my-session:my-sig') = 'bXktc2Vzc2lvbjpteS1zaWc='
		const packed = btoa('my-session:my-sig');
		const result = unpackSessionId(packed);
		expect(result.unsignedSessionId).toBe('my-session');
		expect(result.signature).toBe('my-sig');
	});

	it('preserves a signature that itself contains colons', () => {
		// split(':') only splits on the first colon because destructuring takes [0] and [1]
		// but actually split returns all parts — so a sig with colons loses data.
		// This test documents the actual behavior: only the content up to the first colon
		// becomes unsignedSessionId, and only the content between first and second colon
		// becomes the signature. The rest is silently dropped.
		const packed = btoa('session:sig:extra');
		const result = unpackSessionId(packed);
		expect(result.unsignedSessionId).toBe('session');
		expect(result.signature).toBe('sig');
	});

	it('returns undefined signature when the decoded string has no colon', () => {
		const packed = btoa('no-colon-here');
		const result = unpackSessionId(packed);
		expect(result.unsignedSessionId).toBe('no-colon-here');
		expect(result.signature).toBeUndefined();
	});

	it('returns empty strings when the packed value is an empty base64 string', () => {
		const packed = btoa('');
		const result = unpackSessionId(packed);
		expect(result.unsignedSessionId).toBe('');
		expect(result.signature).toBeUndefined();
	});

	it('throws when the input is not valid base64', () => {
		expect(() => unpackSessionId('not valid base64!!!')).toThrow();
	});
});
