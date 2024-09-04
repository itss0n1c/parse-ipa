import bplist from 'bplist-parser';
import cgbi from 'cgbi-to-png';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import { Readable } from 'node:stream';
import { FileZip, PartialZip } from 'partialzip';
import { parse } from 'plist';
import packageInfo from '../package.json';

type ParsedProvision = Record<'AppIDName' | 'Name' | 'TeamName' | 'UUID', string> &
	Record<'ApplicationIdentifierPrefix' | 'Platform' | 'ProvisionedDevices' | 'TeamIdentifier', string[]> &
	Record<'CreationDate' | 'ExpirationDate', Date> &
	Record<'IsXcodeManaged', false> &
	Record<'DeveloperCertificates', Buffer[]> &
	Record<'DER-Encoded-Profile', Buffer> &
	Record<'Entitlements', Record<string, unknown>> &
	Record<'TimeToLive' | 'Version', number>;

export type Provision = Omit<ParsedProvision, 'DeveloperCertificates' | 'DER-Encoded-Profile'> &
	Record<'DeveloperCertificates', string[]> &
	Record<'DER-Encoded-Profile', string>;
export interface IPA {
	/** bundle id */
	bundle_id: string;
	/** app name */
	name: string;
	/** version number */
	version: string;
	/** build number */
	build: string;
	/** byte size */
	size: number;
	/** Base64 encoded PNG */
	icon: string | null;
	/** signing information, if available */
	provision: Provision | null;
	parser_info: {
		/** when the parser finished */
		time: number;
		/* parser version */
		version: string;
		/** how long it took to parse */
		duration: number;
	};
}

export class IPAParserError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'IPAParserError';
	}
}

const substring = (str: string, start: string, end: string) =>
	str.substring(str.indexOf(start), str.lastIndexOf(end) + end.length);

const _parse_provision = (mp: string) => parse(substring(mp, '<plist', '</plist')) as ParsedProvision;

type CentralDirectoryEntry = ReturnType<PartialZip['files']['get']>;

function _icon_fix(icon: Uint8Array): Promise<Buffer> {
	const stream = new Readable({
		read() {
			this.push(icon);
			this.push(null);
		},
	});
	return new Promise((resolve, reject) =>
		cgbi(stream, (err, stream) => {
			if (err) return reject(err);
			const chunks: Array<Uint8Array> = [];
			stream.on('data', (chunk) => chunks.push(chunk));
			stream.on('end', () => resolve(Buffer.concat(chunks)));
		}),
	);
}

function _icon_clean_name(str: string): [number, number] {
	const base_name = basename(str).replace('AppIcon', '').replace('.png', '').replace('~ipad', '');
	if (!base_name.includes('@')) return [Number.parseInt(base_name.split('x')[0]), 1];
	const [base, size] = base_name.split('@');
	return [Number.parseInt(base.split('x')[0]), Number.parseInt(size.replace('x', ''))];
}

function _icon_sort(a: CentralDirectoryEntry, b: CentralDirectoryEntry) {
	if (!a || !b) return 0;
	const [a_base, a_size] = _icon_clean_name(a.fileName);
	const [b_base, b_size] = _icon_clean_name(b.fileName);
	if (a_base === b_base) return b_size - a_size;
	return b_base - a_base;
}

function _match_key<T extends Record<string, string>>(obj: T, q: keyof T): string | undefined {
	const find = Object.keys(obj).find((k) => k.startsWith(q as string));
	if (!find) return;
	return obj[find];
}

async function _try_prom<T>(prom: Promise<T> | T): Promise<T | undefined> {
	let res: T | undefined;
	try {
		res = await prom;
	} catch (e) {
		console.error(e);
	}

	return res;
}

class IPAFile extends FileZip {
	file_size!: number;

	async init(): Promise<void> {
		await super.init();
		this.file_size = this.size;
	}
}

class IPAPartial extends PartialZip {
	file_size!: number;

	async init(): Promise<void> {
		await super.init();
		this.file_size = this.size;
	}
}

class IPAClass {
	zip!: IPAFile | IPAPartial;
	static async parse(url_or_path: string): Promise<IPA> {
		const start = performance.now();
		const inst = new IPAClass();
		inst.zip = existsSync(url_or_path) ? new IPAFile(url_or_path) : new IPAPartial(url_or_path);

		await inst.zip.init();
		const arr = [...inst.zip.files.values()];
		const info = await inst.getInfo(arr);
		const icon = await _try_prom(inst.getIcon(info, arr));
		const provision = await _try_prom(inst.getProvision(arr));

		const end = performance.now();

		const data: IPA = {
			bundle_id: info.CFBundleIdentifier,
			name: info.CFBundleName,
			version: info.CFBundleShortVersionString,
			build: info.CFBundleVersion,
			size: inst.zip.file_size,
			icon: icon?.toString('base64') ?? null,
			provision: null,
			parser_info: {
				time: Date.now(),
				version: packageInfo.version,
				duration: end - start,
			},
		};
		if (provision)
			data.provision = {
				...provision,
				DeveloperCertificates: provision.DeveloperCertificates.map((c) => c.toString('base64')),
				'DER-Encoded-Profile': provision['DER-Encoded-Profile'].toString('base64'),
			};

		return data;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private async getIcon(info: Record<string, any>, arr: CentralDirectoryEntry[]): Promise<Buffer> {
		let iconsarr: string[] = [];
		for (const file of arr) {
			if (!file) continue;
			if (file.fileName.includes('AppIcon')) iconsarr.push(file.fileName);
		}
		const keys = Object.keys(info);
		const foundKeys = keys.filter((k) => k.startsWith('CFBundleIcons') || k.startsWith('CFBundleIcons~'));
		if (foundKeys.length > 0) {
			for (const k of foundKeys) {
				if (!info[k].CFBundlePrimaryIcon.CFBundleIconFiles) continue;
				iconsarr.push(...info[k].CFBundlePrimaryIcon.CFBundleIconFiles);
			}
		} else {
			if (!info.CFBundleIconFiles)
				if (!info.CFBundleIconFile) {
					const find = _match_key(info, 'CFBundleIconFile~');
					if (!find) iconsarr = [];
					else iconsarr = [find];
				} else iconsarr = [info.CFBundleIconFile];
			else iconsarr = info.CFBundleIconFiles;
		}

		const entries: CentralDirectoryEntry[] = [];
		for (const i of iconsarr) {
			const find = arr.find((k) => k?.fileName.includes(i));
			if (!find) continue;
			entries.push(find);
		}

		entries.sort(_icon_sort);

		const icon = entries[0];
		if (!icon) throw new IPAParserError('No icon found');

		const file = await this.zip.get(icon);
		return _icon_fix(file);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private async getInfo(arr: CentralDirectoryEntry[]): Promise<Record<string, any>> {
		const find = arr.find((k) => k?.fileName.includes('.app/Info.plist'));
		if (!find) throw new IPAParserError('Info.plist not found');
		const buf = await this.zip.get(find);
		const info = await _try_prom(bplist.parseFile(buf));
		if (!info) return parse(buf.toString()) as Record<string, unknown>;

		return info[0];
	}

	private async getProvision(arr: CentralDirectoryEntry[]): Promise<ParsedProvision> {
		const find = arr.find((k) => k?.fileName.includes('embedded.mobileprovision'));
		if (!find) throw new IPAParserError('Provision not found');
		const buf = await this.zip.get(find);
		return _parse_provision(buf.toString());
	}
}

export const parse_ipa = (url_or_path: string) => IPAClass.parse(url_or_path);
