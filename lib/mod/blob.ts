import { parse } from '@plist/plist';
import type { BunFile } from 'bun';
import JSZip from 'jszip';
import { _try_prom, basename, IPAError } from '../util';
import { _filter_icons, _icon_clean_name, _parse_provision, type RawInfo, type RawIPA } from './util';

interface ZipEntry {
	path: string;
	file: JSZip.JSZipObject;
}

async function _get_file(match: string, entries: ZipEntry[]) {
	let matching: ZipEntry | undefined;
	for (const k of entries) {
		if (!k.path.includes(match)) continue;
		matching = k;
	}
	const base = basename(match);
	if (!matching) throw new IPAError(`${base} not found`);
	return matching;
}

async function _get_info(entries: ZipEntry[], zip: JSZip) {
	const file = await _get_file('.app/Info.plist', entries);
	const str = await zip.file(file.path)?.async('arraybuffer');
	if (!str) throw new IPAError('Info.plist not found');
	return parse(str) as RawInfo;
}

function _icon_sort(a: ZipEntry, b: ZipEntry) {
	if (!a || !b) return 0;
	const [a_base, a_size] = _icon_clean_name(a.path);
	const [b_base, b_size] = _icon_clean_name(b.path);
	if (a_base === b_base) return b_size - a_size;
	return b_base - a_base;
}

async function _get_icon(info: RawInfo, _entries: ZipEntry[], zip: JSZip) {
	let icon_arr: string[] = [];
	for (const entry of _entries) {
		if (!entry.path.includes('AppIcon')) continue;
		icon_arr.push(entry.path);
	}

	icon_arr = _filter_icons(info, icon_arr);

	const entries: ZipEntry[] = [];
	for (const i of icon_arr) {
		const file = await _try_prom(_get_file(i, _entries));
		if (!file) continue;
		entries.push(file);
	}

	entries.sort(_icon_sort);

	const icon = entries[0];
	if (!icon) throw new IPAError('No icon found');

	return icon.file.async('uint8array');
}

async function _get_provision(entries: ZipEntry[], zip: JSZip) {
	const file = await _get_file('.app/embedded.mobileprovision', entries);
	const str = await zip.file(file.path)?.async('string');
	if (!str) throw new IPAError('embedded.mobileprovision not found');
	return _parse_provision(str);
}

const create_url = (blob: Blob) => URL.createObjectURL(blob);

export async function _parse_blob(blob: File | BunFile): Promise<RawIPA> {
	const origin_val = 'lastModified' in blob ? (blob.name ?? create_url(blob)) : create_url(blob);

	const start = performance.now();
	const size = blob.size;
	const buf = await blob.arrayBuffer();
	const zip = await new JSZip().loadAsync(buf);

	const entries = Object.entries(zip.files).map<ZipEntry>(([path, file]) => ({
		path,
		file,
	}));

	const info = await _get_info(entries, zip);
	const icon = await _try_prom(_get_icon(info, entries, zip));
	const provision = await _try_prom(_get_provision(entries, zip));

	const end = performance.now();

	return {
		info,
		size,
		icon,
		provision,
		duration: end - start,
		origin: {
			type: 'blob',
			value: origin_val,
		},
	};
}
