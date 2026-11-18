import { defineConfig, type OutExtensionFactory, type UserConfig } from 'tsdown';

const outExtensions: OutExtensionFactory = () => ({ dts: '.d.ts', js: '.js' });

const base_config: UserConfig = {
	minify: true,
	outExtensions,
};

export default defineConfig([
	{
		...base_config,
		entry: './lib/index.ts',
	},
	{
		...base_config,
		platform: 'neutral',
		entry: './lib/browser.ts',
	},
]);
