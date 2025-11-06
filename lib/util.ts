import packageInfo from '../package.json';
import type { RawIPA } from './raw';
import type { IPA, IPAInput, IPAOrigin, IPAOriginType } from './types';

export class IPAError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'IPAError';
	}
}

export function _basename(path: string, suffix?: string): string {
	const p = path.split('/').pop();
	if (!p) return '';
	return suffix && p.endsWith(suffix) ? p.slice(0, -suffix.length) : p;
}

const _is_windows_path = (path: string) => /^[a-zA-Z]:[\\/]/.test(path);
export function _is_url(url: string) {
	if (_is_windows_path(url)) return false;
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
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

const _blob_url = (blob: Blob) => URL.createObjectURL(blob);
const _format_origin = (type: IPAOriginType, value: string): IPAOrigin => ({ type, value });
export function _get_origin(input: IPAInput): IPAOrigin {
	if (typeof input === 'string') {
		if (_is_url(input)) return _format_origin('url', input);
		return _format_origin('file', input);
	}
	const value = 'lastModified' in input ? (input.name ?? _blob_url(input)) : _blob_url(input);
	return _format_origin('blob', value);
}

export const _format_ipa_info = (raw: RawIPA): IPA => ({
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
