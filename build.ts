import { $, build } from 'bun';
import { rm } from 'node:fs/promises';

const clear_dist = () => rm('dist', { recursive: true, force: true });

const build_ts = (is_browser: boolean) =>
	build({
		minify: true,
		target: is_browser ? 'browser' : 'node',
		entrypoints: [`lib/${is_browser ? 'browser' : 'index'}.ts`],
		outdir: 'dist',
		naming: `[dir]/${is_browser ? 'browser' : 'index'}.js`,
		packages: 'external',
		sourcemap: 'linked',
	});

const build_types = () => $`tsc -p .`;

async function clean_types() {
	const files = ['browser.d.ts', 'index.test.d.ts'];
	for (const file of files) await rm(`dist/${file}`);
}

clear_dist()
	.then(() => console.log('Cleared dist directory!'))
	.then(() => build_ts(false))
	.then(() => build_ts(true))
	.then(() => console.log('TypeScript build complete!'))
	.then(build_types)
	.then(clean_types)
	.then(() => console.log('Build complete!'));
