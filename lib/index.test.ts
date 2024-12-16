import { expect, test } from 'bun:test';
import { type IPA, parse_ipa } from './index.js';
import { join } from './mod/util.js';

function test_ipa(ipa: IPA) {
	console.log({
		name: ipa.name,
		verison: ipa.version,
		icon: ipa.icon?.length,
		build: ipa.build,
		bundle_id: ipa.bundle_id,
		parser_info: ipa.parser_info,
	});
	expect(ipa.name).toBe('Aidoku');
	expect(ipa.version).toBe('0.6.10');
	expect(ipa.build).toBe('1');
	expect(ipa.bundle_id).toBe('xyz.skitty.Aidoku');
}

async function get_file() {
	const file = Bun.file(join(process.cwd(), 'test/Enmity 2.ipa'));
	if (!(await file.exists()))
		fetch('https://github.com/Aidoku/Aidoku/releases/download/v0.6.10/Aidoku.ipa').then((r) => Bun.write(file, r));
	return file;
}

test('by url', async () => {
	const ipa = await parse_ipa('https://github.com/Aidoku/Aidoku/releases/download/v0.6.10/Aidoku.ipa');
	test_ipa(ipa);
});

test('by blob', async () => {
	const file = await get_file();
	const ipa = await parse_ipa(file);

	test_ipa(ipa);
});
