import type { _ParsedProvision, IPAOrigin } from '../types';

export interface RawIPA {
	info: Record<string, string>;
	size: number;
	icon?: Uint8Array;
	duration: number;
	provision?: _ParsedProvision;
	origin: IPAOrigin;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type RawInfo = Record<string, any>;

export function _icon_clean_name(str: string): [number, number] {
	const base_name = basename(str).replace('AppIcon', '').replace('.png', '').replace('~ipad', '');
	if (!base_name.includes('@')) return [Number.parseInt(base_name.split('x')[0]), 1];
	const [base, size] = base_name.split('@');
	return [Number.parseInt(base.split('x')[0]), Number.parseInt(size.replace('x', ''))];
}

export function _filter_icons(info: RawInfo, _icon_arr: string[]) {
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

export function basename(path: string, suffix?: string): string {
	const p = path.split('/').pop();
	if (!p) return '';
	return suffix && p.endsWith(suffix) ? p.slice(0, -suffix.length) : p;
}

export const isAbsolute = (path: string): boolean => path.startsWith('/');

export function join(...args: string[]): string {
	if (args.length === 0) return '';
	if (args.length === 1) return args[0];
	let path = '';
	for (const arg of args) {
		if (arg.startsWith('/')) {
			if (path.endsWith('/')) path += arg.slice(1);
			else path += arg;
		} else path += `/${arg}`;
	}
	return path;
}

export function is_url(url: string) {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export function buf_to_arraybuffer(buf: Buffer) {
	const arrayBuffer = new ArrayBuffer(buf.length);
	const view = new Uint8Array(arrayBuffer);
	for (let i = 0; i < buf.length; i++) {
		view[i] = buf[i];
	}
	return arrayBuffer;
}
