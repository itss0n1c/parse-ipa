import { expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { IPAError as BrowserIPAError, parse_ipa as parse_browser } from './browser.ts';
import { IPAError, parse_ipa, schema_ipa } from './index.ts';
import { to_base64 } from './util.ts';

const root = 'Payload/Main.app/';
const watch = `${root}Watch/Watch.app/`;
const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=',
	'base64',
);
const plist = (body: string) => `<plist version="1.0"><dict>${body}</dict></plist>`;
const info = (id: string, icons = '') =>
	plist(`
	<key>CFBundleIdentifier</key><string>${id}</string>
	<key>CFBundleName</key><string>Test</string>
	<key>CFBundleShortVersionString</key><string>1.0</string>
	<key>CFBundleVersion</key><string>1</string>${icons}`);
const primary = (name: string) => `
	<key>CFBundleIcons</key><dict><key>CFBundlePrimaryIcon</key><dict>
	<key>CFBundleIconFiles</key><array><string>${name}</string></array></dict></dict>`;
const archive = (files: Record<string, string | Uint8Array>) =>
	new Blob([
		new Uint8Array(
			zipSync(
				Object.fromEntries(
					Object.entries(files).map(([name, data]) => [
						name,
						typeof data === 'string' ? strToU8(data) : data,
					]),
				),
				{ level: 0 },
			),
		),
	]);

test('main app metadata, profile and icons are independent of ZIP order', async () => {
	const files = {
		[`${root}Info.plist`]: info('test.main', primary('Primary')),
		[`${watch}Info.plist`]: info('test.watch'),
		[`${watch}embedded.mobileprovision`]: 'not the main profile',
		[`${watch}AppIcon1024x1024.png`]: 'not a PNG',
		[`${root}PrimaryBackup.png`]: 'not a PNG',
		[`${root}Primary@2x.png`]: png,
	};
	for (const entries of [Object.entries(files), Object.entries(files).reverse()]) {
		const ipa = await parse_ipa(archive(Object.fromEntries(entries)));
		expect(ipa.bundle_id).toBe('test.main');
		expect(ipa.icon).toBe(png.toString('base64'));
		expect(ipa.provision).toBeNull();
		expect(ipa.parser_info.errors).toEqual([]);
		expect(schema_ipa.allows(ipa)).toBe(true);
	}
});

test('does not guess an icon when a declared icon is missing', async () => {
	const ipa = await parse_ipa(
		archive({
			[`${root}Info.plist`]: info('test.main', primary('Missing')),
			[`${root}AppIcon60x60@3x.png`]: png,
			[`${root}Assets.car`]: 'ignored',
		}),
	);
	expect(ipa.icon).toBeNull();
	expect(ipa.parser_info.errors).toEqual([]);
});

test('ranks filename fallback by estimated pixel size', async () => {
	const ipa = await parse_ipa(
		archive({
			[`${root}Info.plist`]: info('test.main'),
			[`${root}AppIcon76x76@2x~ipad.png`]: 'not selected',
			[`${root}AppIcon60x60@3x.png`]: png,
		}),
	);
	expect(ipa.icon).toBe(png.toString('base64'));
});

test('supports legacy device-specific declarations; selected corrupt icons throw', async () => {
	const legacy = info('test.main', '<key>CFBundleIconFile~ipad</key><string>Tablet.png</string>');
	await expect(
		parse_ipa(
			archive({
				[`${root}Info.plist`]: legacy,
				[`${root}Tablet@2x~ipad.png`]: png,
			}),
		),
	).resolves.toMatchObject({ icon: png.toString('base64') });
	await expect(
		parse_ipa(
			archive({
				[`${root}Info.plist`]: legacy,
				[`${root}Tablet.png`]: 'not a PNG',
			}),
		),
	).rejects.toThrow(IPAError);
});

test('missing, ambiguous or incomplete main metadata throws', async () => {
	const invalid_archives: Record<string, string>[] = [
		{ [`${watch}Info.plist`]: info('test.watch') },
		{ [`${root}Info.plist`]: info('test.main'), 'Payload/Second.app/Info.plist': info('test.other') },
		{ [`${root}Info.plist`]: plist('') },
	];
	for (const files of invalid_archives) {
		await expect(parse_ipa(archive(files))).rejects.toThrow(IPAError);
	}
});

test('profile normalization errors are recoverable', async () => {
	const ipa = await parse_ipa(
		archive({
			[`${root}Info.plist`]: info('test.main'),
			[`${root}embedded.mobileprovision`]: plist('<key>CreationDate</key><string>invalid</string>'),
		}),
	);
	expect(ipa.provision).toBeNull();
	expect(ipa.parser_info.errors).toEqual(['Could not parse or normalize embedded.mobileprovision']);
});

test('valid provisioning data is normalized to JSON-friendly fields', async () => {
	const strings = {
		AppIDName: 'Test',
		Name: 'Test',
		TeamName: 'Team',
		UUID: 'example',
	};
	const arrays = ['ApplicationIdentifierPrefix', 'Platform', 'TeamIdentifier'];
	const xml = plist(`
		${Object.entries(strings)
			.map(([key, value]) => `<key>${key}</key><string>${value}</string>`)
			.join('')}
		${arrays.map((key) => `<key>${key}</key><array><string>test</string></array>`).join('')}
		<key>TimeToLive</key><integer>365</integer><key>Version</key><integer>1</integer>
		<key>CreationDate</key><date>2026-01-01T00:00:00Z</date>
		<key>ExpirationDate</key><date>2027-01-01T00:00:00Z</date>
		<key>DeveloperCertificates</key><array><data>AP9/</data></array>
		<key>DER-Encoded-Profile</key><data>AQID</data>
		<key>Entitlements</key><dict/>`);
	const ipa = await parse_ipa(
		archive({
			[`${root}Info.plist`]: info('test.main'),
			[`${root}embedded.mobileprovision`]: `prefix${xml}suffix`,
		}),
	);
	expect(ipa.parser_info.errors).toEqual([]);
	expect(ipa.provision).toMatchObject({
		CreationDate: '2026-01-01T00:00:00.000Z',
		DeveloperCertificates: ['AP9/'],
		'DER-Encoded-Profile': 'AQID',
	});
});

test('base64 handles large byte arrays', () => {
	const bytes = new Uint8Array(1_000_001).map((_, i) => i % 256);
	expect(to_base64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
});

test('browser accepts blobs and rejects paths; Bun accepts paths', async () => {
	const blob = archive({ [`${root}Info.plist`]: info('test.main') });
	expect((await parse_browser(blob)).bundle_id).toBe('test.main');
	await expect(parse_browser('/test.ipa')).rejects.toThrow(BrowserIPAError);
	const dir = await mkdtemp(join(tmpdir(), 'parse-ipa-'));
	try {
		const path = join(dir, 'test.ipa');
		await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
		expect((await parse_ipa(path)).parser_info.origin).toEqual({ type: 'file', value: path });
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

test('HTTP reads skip unrelated payload and reject servers ignoring Range', async () => {
	const blob = archive({
		[`${root}Info.plist`]: info('test.main'),
		[`${root}unused.bin`]: new Uint8Array(1024 * 1024),
	});
	let transferred = 0;
	const server = Bun.serve({
		hostname: '127.0.0.1',
		port: 0,
		fetch(request) {
			if (request.method === 'HEAD') return new Response(null, { headers: { 'content-length': `${blob.size}` } });
			if (new URL(request.url).pathname === '/no-range') return new Response(blob);
			const range = /^bytes=(\d+)-(\d+)$/.exec(request.headers.get('range') ?? '');
			if (!range) return new Response(null, { status: 400 });
			const start = Number(range[1]);
			const end = Number(range[2]);
			const data = blob.slice(start, end + 1);
			transferred += data.size;
			return new Response(data, {
				status: 206,
				headers: { 'content-range': `bytes ${start}-${end}/${blob.size}` },
			});
		},
	});
	try {
		expect((await parse_ipa(server.url.href)).bundle_id).toBe('test.main');
		expect(transferred).toBeLessThan(blob.size / 4);
		await expect(parse_ipa(new URL('/no-range', server.url).href)).rejects.toThrow('did not honor');
	} finally {
		await server.stop(true);
	}
});
