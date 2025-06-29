import packageInfo from '../package.json';
import type { RawIPA } from './mod';
import type { IPA } from './types';

export class IPAError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'IPAError';
	}
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

const is_windows_path = (path: string) => /^[a-zA-Z]:[\\/]/.test(path);

export function is_url(url: string) {
	if (is_windows_path(url)) return false;
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

export const _substring = (str: string, start: string, end: string) =>
	str.substring(str.indexOf(start), str.lastIndexOf(end) + end.length);

export async function _try_prom<T>(prom: Promise<T> | T, logging = false): Promise<T | undefined> {
	let res: T | undefined;
	try {
		res = await prom;
	} catch (e) {
		if (logging) console.error(e);
	}

	return res;
}

export const format_ipa_info = (raw: RawIPA): IPA => ({
	bundle_id: raw.info.CFBundleIdentifier,
	name: raw.info.CFBundleName,
	version: raw.info.CFBundleShortVersionString,
	build: raw.info.CFBundleVersion,
	size: raw.size,
	icon: raw.icon ? btoa(String.fromCharCode(...raw.icon)) : null,
	...(raw.provision
		? {
				provision: {
					...raw.provision,
					DeveloperCertificates: raw.provision.DeveloperCertificates.map((c) =>
						btoa(String.fromCharCode(...new Uint8Array(c))),
					),
					'DER-Encoded-Profile': btoa(
						String.fromCharCode(...new Uint8Array(raw.provision['DER-Encoded-Profile'])),
					),
				},
			}
		: { provision: null }),
	parser_info: {
		time: Date.now(),
		version: packageInfo.version,
		duration: raw.duration,
		origin: raw.origin,
	},
});
