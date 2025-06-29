import { parse } from '@plist/plist';
import { decgbi } from 'decgbi';
import { PartialZip } from 'partialzip';
import { _try_prom, basename, buf_to_arraybuffer, IPAError } from '../util';
import { _filter_icons, _parse_provision, type RawInfo, type RawIPA } from './util';

class PartialZipWithSize extends PartialZip {
	file_size!: number;

	async init(): Promise<void> {
		await super.init();
		this.file_size = this.size;
	}
}

type CentralDirectoryEntry = ReturnType<PartialZip['files']['get']> & {};

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

function _get_file(match: string, zip: PartialZipWithSize) {
	let matching: CentralDirectoryEntry | undefined;
	for (const [k] of zip.files) {
		if (!k.includes(match)) continue;
		matching = zip.files.get(k);
	}
	const base = basename(match);
	if (!matching) throw new IPAError(`${base} not found`);
	return matching;
}

async function _get_info(zip: PartialZipWithSize) {
	const file = _get_file('.app/Info.plist', zip);
	const buf = await zip.get(file);
	const arrayBuffer = buf_to_arraybuffer(buf);
	return parse(arrayBuffer) as RawInfo;
}

async function _get_icon(info: RawInfo, zip: PartialZipWithSize) {
	let icon_arr: string[] = [];
	for (const file of zip.files.values()) {
		if (!file.fileName.includes('AppIcon')) continue;
		icon_arr.push(file.fileName);
	}

	icon_arr = _filter_icons(info, icon_arr);

	const entries: CentralDirectoryEntry[] = [];
	for (const i of icon_arr) {
		const file = await _try_prom(_get_file(i, zip));
		if (!file) continue;
		entries.push(file);
	}

	entries.sort(_icon_sort);

	const icon = entries[0];
	if (!icon) throw new IPAError('No icon found');

	const file = await zip.get(icon);
	return decgbi(Uint8Array.from(file));
}

async function _get_provision(zip: PartialZipWithSize) {
	const file = _get_file('.app/embedded.mobileprovision', zip);
	const buf = await zip.get(file);
	return _parse_provision(buf.toString());
}

export async function _parse_url(url: string): Promise<RawIPA> {
	const start = performance.now();
	const zip = new PartialZipWithSize(url);
	await zip.init();
	const info = await _get_info(zip);
	const icon = await _try_prom(_get_icon(info, zip));
	const provision = await _try_prom(_get_provision(zip));
	const end = performance.now();

	return {
		info,
		size: zip.file_size,
		icon,
		duration: end - start,
		provision,
		origin: {
			type: 'url',
			value: url,
		},
	};
}
