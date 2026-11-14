import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		'browser-sessions': 'src/browser-sessions/index.ts',
		errors: 'src/errors/index.ts',
		logger: 'src/logger/index.ts',
		middleware: 'src/middleware/index.ts',
		oauth: 'src/oauth/index.ts',
		response: 'src/response/index.ts',
		tap: 'src/tap/index.ts',
		utils: 'src/utils/index.ts',
		vite: 'src/vite/index.ts',
	},
	format: ['esm'],
	dts: true,
	clean: true,
	sourcemap: true,
	external: ['cloudflare:workers'],
});
