import { defineConfig } from 'vitepress';

export default defineConfig({
	title: 'rwsdk-atp',
	description: 'Utilities for making a RedwoodSDK app work nicely on the AT Protocol',
	base: '/rwsdk-atp',
	themeConfig: {
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Guides', link: '/guides/' },
			{ text: 'API Reference', link: '/api/' },
		],
		sidebar: {
			'/guides/': [
				{
					text: 'Guides',
					items: [
						{ text: 'Getting Started', link: '/guides/getting-started/' },
						{ text: 'Error Classes', link: '/guides/errors' },
						{ text: 'Logging', link: '/guides/logging' },
						{ text: 'Middleware', link: '/guides/middleware' },
						{ text: 'Response Helpers', link: '/guides/response' },
						{ text: 'Multiple Queues', link: '/guides/multiple-queues' },
						{ text: 'Tap Integration', link: '/guides/tap-integration' },
					],
				},
			],
			'/api/': [
				{
					text: 'API Reference',
					items: [
						{ text: 'Overview', link: '/api/' },
						{ text: 'browser-sessions', link: '/api/browser-sessions' },
						{ text: 'errors', link: '/api/errors' },
						{ text: 'logger', link: '/api/logger' },
						{ text: 'middleware', link: '/api/middleware' },
						{ text: 'oauth', link: '/api/oauth' },
						{ text: 'tap', link: '/api/tap' },
						{ text: 'utils', link: '/api/utils' },
						{ text: 'vite', link: '/api/vite' },
					],
				},
			],
		},
	},
});
