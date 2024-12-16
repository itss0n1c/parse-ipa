import { expect, test } from 'bun:test';
import { type IPA, parse_ipa } from './index.js';

function test_ipa(ipa: IPA) {
	console.log({
		name: ipa.name,
		verison: ipa.version,
		build: ipa.build,
		bundle_id: ipa.bundle_id,
		parser_info: ipa.parser_info,
	});
	expect(ipa.name).toBe('Aidoku');
	expect(ipa.version).toBe('0.6.10');
	expect(ipa.build).toBe('1');
	expect(ipa.bundle_id).toBe('xyz.skitty.Aidoku');
}

test('by url', async () => {
	const ipa = await parse_ipa('https://github.com/Aidoku/Aidoku/releases/download/v0.6.10/Aidoku.ipa');
	test_ipa(ipa);
});

test('by file', async () => {
	const file = Bun.file('test/test.ipa');
	if (!(await file.exists()))
		fetch('https://github.com/Aidoku/Aidoku/releases/download/v0.6.10/Aidoku.ipa').then((r) => Bun.write(file, r));

	if (!file.name) throw new Error('file.name is undefined');
	const ipa = await parse_ipa(file.name);

	test_ipa(ipa);
});
