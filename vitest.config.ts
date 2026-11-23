import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/__tests__/**', 'src/**/types.ts', 'src/index.ts'],
			thresholds: {
				branches: 30,
				lines: 30, // using this to make sure we don't miss something big or have dead code
				'src/browser-sessions/**': {
					branches: 40,
				},
				'src/crypto/**': {
					branches: 100,
				},
				'src/errors/**': {
					branches: 100,
				},
				'src/logger/**': {
					branches: 75,
				},
				'src/oauth/**': {
					branches: 32,
				},
				'src/tap/**': {
					branches: 100,
				},
				'src/utils/**': {
					branches: 100,
				},
				'src/vite/**': {
					branches: 100,
				},
			},
		},
	},
});
