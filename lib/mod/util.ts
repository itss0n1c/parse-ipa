import cgbi from 'cgbi-to-png';
import { basename } from 'node:path';
import { Readable } from 'node:stream';
import type { _ParsedProvision, IPAOrigin } from '../types';

export interface RawIPA {
	info: Record<string, string>;
	size: number;
	icon?: Buffer;
	duration: number;
	provision?: _ParsedProvision;
	origin: IPAOrigin;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type RawInfo = Record<string, any>;

export function _icon_fix(icon: Uint8Array): Promise<Buffer> {
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
