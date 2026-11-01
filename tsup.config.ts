import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		'browser-sessions': 'src/browser-sessions/index.ts',
		logger: 'src/logger/index.ts',
	},
	format: ['esm'],
	dts: true,
	clean: true,
	sourcemap: true,
	external: ['cloudflare:workers'],
});
