import { describe, expect, it } from 'vitest';
import { rwsdkAtp } from '../index';

describe('rwsdkAtp vite plugin', () => {
	it('returns an array with one plugin', () => {
		expect(rwsdkAtp()).toHaveLength(1);
	});

	it('plugin is named rwsdk-atp-patch-redirect', () => {
		expect(rwsdkAtp()[0].name).toBe('rwsdk-atp-patch-redirect');
	});

	describe('transform', () => {
		const getTransform = (): ((code: string, id: string) => string | null) => rwsdkAtp()[0].transform as any;

		it('replaces redirect: "error" with redirect: \'manual\' for @atproto modules', () => {
			const result = getTransform()('redirect: "error",', '@atproto/identity');
			expect(result).toBe("redirect: 'manual',");
		});

		it("replaces redirect: 'error' (single quotes) for @atproto modules", () => {
			const result = getTransform()("redirect: 'error',", '@atproto/oauth-client');
			expect(result).toBe("redirect: 'manual',");
		});

		it('replaces all occurrences in the same module', () => {
			const code = "redirect: 'error'; redirect: 'error';";
			const result = getTransform()(code, '@atproto/identity');
			expect(result).toBe("redirect: 'manual'; redirect: 'manual';");
		});

		it('applies to atproto-labs modules', () => {
			const result = getTransform()("redirect: 'error'", '@atproto-labs/handle-resolver');
			expect(result).toBe("redirect: 'manual'");
		});

		it('returns null for unrelated modules', () => {
			const result = getTransform()("redirect: 'error'", 'some-other-package');
			expect(result).toBeNull();
		});

		it('returns null when the atproto module has no redirect: error to replace', () => {
			const result = getTransform()("redirect: 'follow'", '@atproto/identity');
			expect(result).toBeNull();
		});
	});
});
