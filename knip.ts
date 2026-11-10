export default {
	entry: ['docs/.vitepress/config.ts'],
	tags: ['-lintignore', '-knipTestExport'],
	ignoreDependencies: ['cloudflare'],
	ignoreExportsUsedInFile: true,
	ignoreFiles: ['release.config.js'],
};
