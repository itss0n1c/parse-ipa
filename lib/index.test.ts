import { beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import pkg from '../package.json';
import { type IPA, type IPAInput, parse_ipa } from '.';
import { _is_url } from './util';

setDefaultTimeout(10000000);

const proj_root = join(import.meta.url.replace(`file://${process.platform === 'win32' ? '/' : ''}`, ''), '../..');
const test_folder = join(proj_root, 'test');

const ipa_link = 'https://github.com/NeoFreeBird/app/releases/download/2.2/NeoFreeBird-2.2-Twitter-11.35.ipa';
const id = new Bun.MD5().update(ipa_link).digest('hex');

function test_ipa(ipa: IPA) {
	console.log({
		name: `${ipa.name} (${ipa.bundle_id})`,
		version: `${ipa.version} (${ipa.build})`,
		size: ipa.size,
		icon: ipa.icon?.length,
		time: `${Math.round(ipa.parser_info.duration)}ms`,
		origin: `${ipa.parser_info.origin.type}:${ipa.parser_info.origin.value}`,
	});
	expect(ipa.name).toBe('Twitter');
	expect(ipa.version).toBe('11.35');
	expect(ipa.build).toBe('12');
	expect(ipa.bundle_id).toBe('com.atebits.Tweetie2');
	expect(ipa.size).toBeNumber();
	expect(ipa.parser_info).toBeDefined();
	expect(ipa.parser_info.time).toBeNumber();
	expect(ipa.parser_info.version).toBe(pkg.version);
	expect(ipa.parser_info.origin).toBeDefined();
}

async function parse(file: IPAInput) {
	const ipa = await parse_ipa(file);
	await Bun.write(
		join(test_folder, `${typeof file === 'string' ? (_is_url(file) ? 'url' : 'path') : 'blob'}.json`),
		JSON.stringify(ipa, null, 4),
	);
	return ipa;
}

test('by url', async () => {
	const ipa = await parse(ipa_link);
	test_ipa(ipa);
});

describe('from save file', () => {
	const path = join(test_folder, `${id}.ipa`);
	const file = Bun.file(path);
	beforeAll(async () => {
		if (!(await file.exists())) {
			const res = await fetch(ipa_link);
			const buf = await res.arrayBuffer().then(Buffer.from);
			await writeFile(path, buf);
		}
	});

	test('by file', async () => {
		if (!file.name) return;
		const ipa = await parse(file.name);
		test_ipa(ipa);
	});

	test('by blob', async () => {
		const ipa = await parse(file);
		test_ipa(ipa);
	});
});
