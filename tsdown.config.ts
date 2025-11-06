import { defineConfig, type OutExtensionFactory, type UserConfig } from 'tsdown';

const outExtensions: OutExtensionFactory = () => ({
	dts: '.d.ts',
	js: '.js',
});
const base_config: UserConfig = {
	dts: true,
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
		dts: false,
		entry: './lib/browser.ts',
	},
]);
