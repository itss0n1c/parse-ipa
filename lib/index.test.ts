import { expect, test } from 'bun:test';
import { parse_ipa } from './index.js';

test('parse-ipa', async () => {
	const ipa = await parse_ipa('https://github.com/Aidoku/Aidoku/releases/download/v0.6.6/Aidoku.ipa');

	console.log(ipa);

	expect(ipa.name).toBe('Aidoku');
	expect(ipa.version).toBe('0.6.6');
	expect(ipa.build).toBe('2');
	expect(ipa.bundle_id).toBe('xyz.skitty.Aidoku');
});
