import { parse } from '@plist/plist';
import { decgbi } from 'decgbi';
import StreamZip, { type StreamZipAsync, type ZipEntry } from 'node-stream-zip';
import { stat } from 'node:fs/promises';
import { _try_prom, basename, buf_to_arraybuffer, IPAError } from '../util';
import { _filter_icons, _icon_clean_name, _parse_provision, type RawInfo, type RawIPA } from './util';

async function _get_file(match: string, entries: ZipEntry[]) {
	let matching: ZipEntry | undefined;
	for (const entry of entries) {
		if (!entry.name.includes(match)) continue;
		matching = entry;
	}
	const base = basename(match);
	if (!matching) throw new IPAError(`${base} not found`);
	return matching;
}

async function _get_info(entries: ZipEntry[], zip: StreamZipAsync): Promise<RawInfo> {
	const file = await _get_file('.app/Info.plist', entries);
	const buf = await zip.entryData(file);
	const arrayBuffer = buf_to_arraybuffer(buf);
	return parse(arrayBuffer) as RawInfo;
}

function _icon_sort(a: ZipEntry, b: ZipEntry) {
	if (!a || !b) return 0;
	const [a_base, a_size] = _icon_clean_name(a.name);
	const [b_base, b_size] = _icon_clean_name(b.name);
	if (a_base === b_base) return b_size - a_size;
	return b_base - a_base;
}

async function _get_icon(info: RawInfo, _entries: ZipEntry[], zip: StreamZipAsync) {
	let icon_arr: string[] = [];
	for (const file of _entries) {
		if (!file.name.includes('AppIcon')) continue;
		icon_arr.push(file.name);
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

	const file = await zip.entryData(icon);
	return decgbi(Uint8Array.from(file));
}

async function _get_provision(entries: ZipEntry[], zip: StreamZipAsync) {
	const file = await _get_file('.app/embedded.mobileprovision', entries);
	const buf = await zip.entryData(file);
	return _parse_provision(buf.toString());
}

const get_entries = (zip: StreamZipAsync) => zip.entries().then((e) => Object.values(e).filter((e) => !e.isDirectory));

export async function _parse_file(path: string): Promise<RawIPA> {
	const start = performance.now();

	const zip = new StreamZip.async({ file: path });
	const entries = await get_entries(zip);
	const size = await stat(path).then((s) => s.size);
	const info = await _get_info(entries, zip);
	const icon = await _try_prom(_get_icon(info, entries, zip));
	const provision = await _try_prom(_get_provision(entries, zip));
	const end = performance.now();

	await zip.close();

	return {
		info,
		size,
		icon,
		duration: end - start,
		provision,
		origin: {
			type: 'file',
			value: path,
		},
	};
}
