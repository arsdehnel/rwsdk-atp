import { describe, expect, it } from 'vitest';
import { packSessionId } from '../pack-session-id';
import { unpackSessionId } from '../unpack-session-id';

describe('packSessionId / unpackSessionId', () => {
	it('round-trips unsigned ID and signature', () => {
		const unsignedSessionId = 'session-abc-123';
		const signature = 'sig-xyz';
		const packed = packSessionId(unsignedSessionId, signature);
		const unpacked = unpackSessionId(packed);
		expect(unpacked.unsignedSessionId).toBe(unsignedSessionId);
		expect(unpacked.signature).toBe(signature);
	});

	it('produces a base64 string', () => {
		const packed = packSessionId('id', 'sig');
		expect(() => atob(packed)).not.toThrow();
	});

	it('two different sessions produce different packed values', () => {
		const a = packSessionId('session-a', 'sig-a');
		const b = packSessionId('session-b', 'sig-b');
		expect(a).not.toBe(b);
	});

	describe('colon in unsigned session ID', () => {
		it('throws when the unsigned session ID contains a colon', () => {
			expect(() => packSessionId('session:with:colons', 'sig')).toThrow('unsigned session ID must not contain ":"');
		});

		it('does not throw for a normal ID without colons', () => {
			expect(() => packSessionId('550e8400-e29b-41d4-a716-446655440000', 'sig')).not.toThrow();
		});
	});
});
