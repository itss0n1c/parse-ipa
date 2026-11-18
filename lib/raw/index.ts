import { parse } from '@plist/plist';
import { decgbi } from 'decgbi';
import { HTTPRangeReader, unzipRaw, type ZipEntry } from 'unzipit';
import package_info from '../../package.json';
import { type IPA, type IPAInput, type IPAOrigin, type Provision, schema_provision } from '../types';
import { IPAError, to_base64, with_ipa_error } from '../util';

function as_record(value: unknown): Record<string, unknown> | undefined {
	if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
}

function required_string(info: Record<string, unknown>, key: string): string {
	const value = info[key];
	if (typeof value !== 'string' || !value.trim()) throw new IPAError(`Invalid or missing ${key} in Info.plist`);
	return value;
}

export async function parse_source(input: IPAInput, origin?: IPAOrigin): Promise<IPA> {
	const start = performance.now();
	const source = typeof input === 'string' ? new HTTPRangeReader(input) : input;
	const size = source instanceof HTTPRangeReader ? await source.getLength() : source.size;
	const { entries } = await unzipRaw(source);
	const plists = entries.filter(({ name }) => /^Payload\/[^/]+\.app\/Info\.plist$/.test(name));
	if (plists.length !== 1) {
		throw new IPAError(
			plists.length ? 'Multiple main app Info.plist entries found' : 'Main app Info.plist not found',
		);
	}
	const plist = plists[0];
	const root = plist.name.slice(0, -'Info.plist'.length);
	const info = await with_ipa_error('Could not parse main app Info.plist', async () => {
		const value = as_record(parse(await plist.arrayBuffer()));
		if (!value) throw new IPAError('Main app Info.plist must contain a dictionary');
		return value;
	});
	const bundle_id = required_string(info, 'CFBundleIdentifier');
	const name = required_string(info, 'CFBundleName');
	const version = required_string(info, 'CFBundleShortVersionString');
	const build = required_string(info, 'CFBundleVersion');
	const icon_entry = select_icon(root, info, entries);
	const icon = icon_entry
		? await with_ipa_error('Could not read or decode the main app icon', async () =>
				to_base64(await decgbi(new Uint8Array(await icon_entry.arrayBuffer()))),
			)
		: null;
	const errors: string[] = [];
	let provision: Provision | null = null;
	const profiles = entries.filter(({ name }) => name === `${root}embedded.mobileprovision`);
	if (profiles.length > 1) {
		errors.push('Multiple main app embedded.mobileprovision entries found');
	} else if (profiles.length === 1) {
		try {
			provision = normalize_provision(await profiles[0].text());
		} catch {
			errors.push('Could not parse or normalize embedded.mobileprovision');
		}
	}
	return {
		bundle_id,
		name,
		version,
		build,
		size,
		icon,
		provision,
		parser_info: {
			time: Date.now(),
			duration: performance.now() - start,
			version: package_info.version,
			origin:
				origin ??
				(typeof input === 'string'
					? { type: 'url', value: input }
					: { type: 'blob', value: 'name' in input && typeof input.name === 'string' ? input.name : 'Blob' }),
			errors,
		},
	};
}

function icon_stem(name: string): string {
	return name.replace(/\.png$/i, '').replace(/(?:@[123]x|~(?:iphone|ipad))+$/i, '');
}

function select_icon(root: string, info: Record<string, unknown>, entries: ZipEntry[]): ZipEntry | undefined {
	const declared = new Set<string>();
	function add(value: unknown) {
		if (Array.isArray(value)) {
			for (const name of value) add(name);
		} else if (typeof value === 'string' && value.trim() && !/[\\/]/.test(value)) {
			declared.add(icon_stem(value));
		}
	}
	for (const suffix of ['', '~iphone', '~ipad']) {
		const primary = as_record(as_record(info[`CFBundleIcons${suffix}`])?.CFBundlePrimaryIcon);
		add(primary?.CFBundleIconFiles);
		add(primary?.CFBundleIconName);
		if (suffix === '') add(info.CFBundleIconName);
	}
	if (!declared.size) {
		for (const suffix of ['', '~iphone', '~ipad']) {
			add(info[`CFBundleIconFiles${suffix}`]);
			add(info[`CFBundleIconFile${suffix}`]);
		}
	}
	const candidates = entries.flatMap((entry) => {
		if (!entry.name.startsWith(root)) return [];
		const name = entry.name.slice(root.length);
		if (name.includes('/') || !/\.png$/i.test(name)) return [];
		const stem = icon_stem(name);
		if (declared.size ? !declared.has(stem) : !/^AppIcon(?:\d+(?:\.\d+)?x\d+(?:\.\d+)?)?$/.test(stem)) return [];
		const width = Number(/(\d+(?:\.\d+)?)x\d+(?:\.\d+)?$/.exec(stem)?.[1] ?? 0);
		const scale = Number(/@([123])x/i.exec(name)?.[1] ?? 1);
		return [{ entry, name, pixels: width * scale, scale }];
	});
	candidates.sort(
		(a, b) => b.pixels - a.pixels || b.scale - a.scale || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
	);
	if (candidates.length > 1 && candidates[0].name === candidates[1].name) {
		throw new IPAError('Multiple entries for the selected main app icon');
	}
	return candidates[0]?.entry;
}

function normalize_provision(text: string): Provision {
	const start = text.indexOf('<plist');
	const end = text.indexOf('</plist>', start);
	if (start < 0 || end < 0) throw new IPAError('Provisioning profile has no XML plist');
	const profile = as_record(parse(text.slice(start, end + '</plist>'.length)));
	if (!profile) throw new IPAError('Provisioning plist must contain a dictionary');
	const encode = (value: unknown) => {
		if (value instanceof ArrayBuffer) return to_base64(new Uint8Array(value));
		if (value instanceof Uint8Array) return to_base64(value);
		throw new IPAError('Invalid provisioning data field');
	};
	return schema_provision.assert({
		...profile,
		CreationDate: profile.CreationDate instanceof Date ? profile.CreationDate.toISOString() : undefined,
		ExpirationDate: profile.ExpirationDate instanceof Date ? profile.ExpirationDate.toISOString() : undefined,
		DeveloperCertificates: Array.isArray(profile.DeveloperCertificates)
			? profile.DeveloperCertificates.map(encode)
			: undefined,
		...(profile['DER-Encoded-Profile'] !== undefined
			? { 'DER-Encoded-Profile': encode(profile['DER-Encoded-Profile']) }
			: {}),
	});
}
