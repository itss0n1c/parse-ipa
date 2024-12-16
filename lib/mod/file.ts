import { parseFile } from 'bplist-parser';
import StreamZip from 'node-stream-zip';
import { basename, isAbsolute, join } from 'node:path';
import { parse } from 'plist';
import { _parse_provision, _try_prom } from '../util';
import { _filter_icons, _icon_clean_name, _icon_fix, type RawInfo, type RawIPA } from './util';

interface RawZipEntry {
	path: string;
	entry: StreamZip.ZipEntry;
}

async function _get_file(match: string, entries: RawZipEntry[]) {
	let matching: RawZipEntry | undefined;
	for (const k of entries) {
		if (!k.path.includes(match)) continue;
		matching = k;
	}
	const base = basename(match);
	if (!matching) throw new Error(`${base} not found`);
	return matching;
}

async function _get_info(entries: RawZipEntry[], zip: StreamZip.StreamZipAsync) {
	const file = await _get_file('.app/Info.plist', entries);
	const buf = await zip.entryData(file.path);
	const info = await _try_prom(parseFile(buf));
	if (!info) return parse(buf.toString()) as RawInfo;
	return info[0];
}

function _icon_sort(a: RawZipEntry, b: RawZipEntry) {
	if (!a || !b) return 0;
	const [a_base, a_size] = _icon_clean_name(a.entry.name);
	const [b_base, b_size] = _icon_clean_name(b.entry.name);
	if (a_base === b_base) return b_size - a_size;
	return b_base - a_base;
}

async function _get_icon(info: RawInfo, _entries: RawZipEntry[], zip: StreamZip.StreamZipAsync) {
	let icon_arr: string[] = [];
	for (const entry of _entries) {
		if (!entry.path.includes('AppIcon')) continue;
		icon_arr.push(entry.path);
	}

	icon_arr = _filter_icons(info, icon_arr);

	const entries: RawZipEntry[] = [];
	for (const i of icon_arr) {
		const file = await _try_prom(_get_file(i, _entries));
		if (!file) continue;
		entries.push(file);
	}

	entries.sort(_icon_sort);

	const icon = entries[0];
	if (!icon) throw new Error('No icon found');

	const file = await zip.entryData(icon.path);
	return _icon_fix(Uint8Array.from(file));
}

async function _get_provision(entries: RawZipEntry[], zip: StreamZip.StreamZipAsync) {
	const file = await _get_file('.app/embedded.mobileprovision', entries);
	const buf = await zip.entryData(file.path);
	return _parse_provision(buf.toString());
}

async function parse_entries(zip: StreamZip.StreamZipAsync): Promise<RawZipEntry[]> {
	const entries = await zip.entries();
	return Object.entries(entries).map(([k, v]) => ({ path: k, entry: v }));
}

export async function _parse_file(path: string): Promise<RawIPA> {
	const start = performance.now();
	const file = Bun.file(path);
	const size = file.size;
	const zip = new StreamZip.async({ file: path });
	const entries = await parse_entries(zip);

	const info = await _get_info(entries, zip);
	const icon = await _try_prom(_get_icon(info, entries, zip));
	const provision = await _get_provision(entries, zip);

	await zip.close();

	const end = performance.now();

	const full_path = isAbsolute(path) ? path : join(process.cwd(), path);

	return {
		info,
		size,
		icon,
		duration: end - start,
		provision,
		origin: {
			type: 'file',
			value: full_path,
		},
	};
}
