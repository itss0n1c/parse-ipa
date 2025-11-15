import { parse } from '@plist/plist';
import { decgbi } from 'decgbi';
import type { ZipEntry } from 'unzipit';
import { _basename, _substring, _try_prom, IPAError } from '../util';
import type { IPAZipData, RawProvision } from './types';

export * from './types';

export async function _parse_raw(input: IPAZipData) {
	const start = performance.now();
	const { zip, size, origin } = input;
	const entries = Object.values(zip.entries);

	const info = await _get_info(entries);
	const icon = await _try_prom(_get_icon(info, entries));
	const provision = await _try_prom(_get_provision(entries));

	const end = performance.now();

	return {
		info,
		size,
		icon,
		provision,
		duration: end - start,
		origin,
	};
}

async function _get_file(match: string, entries: ZipEntry[]) {
	let matching: ZipEntry | undefined;
	for (const k of entries) {
		if (!k.name.includes(match)) continue;
		matching = k;
	}
	const base = _basename(match);
	if (!matching) throw new IPAError(`${base} not found`);
	return matching;
}

async function _get_info(entries: ZipEntry[]) {
	const file = await _get_file('.app/Info.plist', entries);
	const str = await file.arrayBuffer();
	if (!str) throw new IPAError('Info.plist not found');
	return parse(str) as RawInfo;
}

function _icon_sort(a: ZipEntry, b: ZipEntry) {
	if (!a || !b) return 0;
	const [a_base, a_size] = _icon_clean_name(a.name);
	const [b_base, b_size] = _icon_clean_name(b.name);
	if (a_base === b_base) return b_size - a_size;
	return b_base - a_base;
}

async function _get_icon(info: RawInfo, _entries: ZipEntry[]) {
	let icon_arr: string[] = [];
	for (const entry of _entries) {
		if (!entry.name.includes('AppIcon')) continue;
		icon_arr.push(entry.name);
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

	const arr = await icon.arrayBuffer().then((x) => new Uint8Array(x));
	return decgbi(arr);
}

async function _get_provision(entries: ZipEntry[]) {
	const file = await _get_file('.app/embedded.mobileprovision', entries);
	const str = await file.text();
	if (!str) throw new IPAError('embedded.mobileprovision not found');
	return _parse_provision(str);
}

export const _parse_provision = (mp: string) => parse(_substring(mp, '<plist', '</plist>')) as RawProvision;

export function _icon_clean_name(str: string): [number, number] {
	const base_name = _basename(str).replace('AppIcon', '').replace('.png', '').replace('~ipad', '');
	if (!base_name.includes('@')) return [Number.parseInt(base_name.split('x')[0], 10), 1];
	const [base, size] = base_name.split('@');
	return [Number.parseInt(base.split('x')[0], 10), Number.parseInt(size.replace('x', ''), 10)];
}

// biome-ignore lint/suspicious/noExplicitAny: value can be any type
type RawInfo = Record<string, any>;
function _filter_icons(info: RawInfo, _icon_arr: string[]) {
	const _match_key = (key: string): string | undefined => Object.keys(info).find((k) => k.startsWith(key));
	let icon_arr = _icon_arr;
	const keys = Object.keys(info);
	const found_keys = keys.filter((k) => k.startsWith('CFBundleIcons') || k.startsWith('CFBundleIcons~'));
	if (found_keys.length > 0) {
		for (const k of found_keys) {
			if (!info[k].CFBundlePrimaryIcon.CFBundleIconFiles) continue;
			icon_arr.push(...info[k].CFBundlePrimaryIcon.CFBundleIconFiles);
		}
	} else {
		if (!info.CFBundleIconFiles)
			if (!info.CFBundleIconFile) {
				const find = _match_key('CFBundleIconFile~');
				if (!find) icon_arr = [];
				else icon_arr = [find];
			} else icon_arr = [info.CFBundleIconFile];
		else icon_arr = info.CFBundleIconFiles;
	}
	return icon_arr;
}
