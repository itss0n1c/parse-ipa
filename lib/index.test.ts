import { expect, setDefaultTimeout, test } from 'bun:test';
import { join } from 'node:path';
import { type IPA, type IPAInput, parse_ipa } from './index.js';
import { is_url } from './util.js';

setDefaultTimeout(10000000);

const proj_root = join(import.meta.url.replace(`file://${process.platform === 'win32' ? '/' : ''}`, ''), '../..');
const test_folder = join(proj_root, 'test');

const ipa_link = 'https://files.s0n1c.ca/miru/v69/miru.ipa';
const id = new Bun.MD5().update(ipa_link).digest('hex');

function test_ipa(ipa: IPA) {
	// console.log({
	// 	name: ipa.name,
	// 	verison: ipa.version,
	// 	size: ipa.size,
	// 	icon: ipa.icon?.length,
	// 	build: ipa.build,
	// 	bundle_id: ipa.bundle_id,
	// 	parser_info: ipa.parser_info,
	// });
	console.log('icon size:', ipa.icon?.length);
	expect(ipa.name).toBe('miru_app');
	expect(ipa.version).toBe('0.0.69');
	expect(ipa.build).toBe('0.0.69');
	expect(ipa.bundle_id).toBe('com.rawra.miru-app');
}

async function get_file() {
	const file = Bun.file(join(test_folder, `${id}.ipa`));
	if (!(await file.exists())) await fetch(ipa_link).then((r) => Bun.write(file, r));
	return file;
}

async function parse(file: IPAInput) {
	const ipa = await parse_ipa(file);
	await Bun.write(
		join(test_folder, `${typeof file === 'string' ? (is_url(file) ? 'url' : 'path') : 'blob'}.json`),
		JSON.stringify(ipa, null, 4),
	);
	return ipa;
}

test('by url', async () => {
	const ipa = await parse(ipa_link);
	test_ipa(ipa);
});

test('by file', async () => {
	const file = await get_file();
	if (!file.name) return;
	const ipa = await parse(file.name);
	test_ipa(ipa);
});

test('by blob', async () => {
	const file = await get_file();
	const ipa = await parse(file);
	test_ipa(ipa);
});
