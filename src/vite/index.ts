import type { Plugin } from 'vite';

export function rwsdkAtp(): Plugin[] {
	return [
		{
			name: 'rwsdk-atp-patch-redirect',
			transform(code: string, id: string): string | null {
				if (id.includes('@atproto') || id.includes('atproto-labs')) {
					const patched = code.replace(/redirect:\s*['"]error['"]/g, "redirect: 'manual'");
					return patched !== code ? patched : null;
				}
				return null;
			},
		},
	];
}
