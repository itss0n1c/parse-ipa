import { expect, test } from 'bun:test';
import { join } from 'node:path';
import { type IPA, parse_ipa } from './index.js';

const proj_root = join(import.meta.url.replace('file://', ''), '../..');
const test_folder = join(proj_root, 'test');

const ipa_link = 'https://github.com/rileytestut/Delta/releases/download/v1.6/Delta_1_6.ipa';
const id = new Bun.MD5().update(ipa_link).digest('hex');

function test_ipa(ipa: IPA) {
	console.log({
		name: ipa.name,
		verison: ipa.version,
		size: ipa.size,
		icon: ipa.icon?.length,
		build: ipa.build,
		bundle_id: ipa.bundle_id,
		parser_info: ipa.parser_info,
	});
	expect(ipa.name).toBe('Delta');
	expect(ipa.version).toBe('1.6');
	expect(ipa.build).toBe('102');
	expect(ipa.bundle_id).toBe('com.rileytestut.Delta');
}

async function get_file() {
	const file = Bun.file(join(test_folder, `${id}.ipa`));
	if (!(await file.exists())) await fetch(ipa_link).then((r) => Bun.write(file, r));

	return file;
}

test('by url', async () => {
	const ipa = await parse_ipa(ipa_link);
	test_ipa(ipa);
});

test('by file', async () => {
	const file = await get_file();
	if (!file.name) return;
	const ipa = await parse_ipa(file.name);
	test_ipa(ipa);
});

test('by blob', async () => {
	const file = await get_file();
	const ipa = await parse_ipa(file);
	test_ipa(ipa);
});
