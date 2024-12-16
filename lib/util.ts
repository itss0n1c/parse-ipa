import { parse } from '@plist/plist';
import packageInfo from '../package.json';
import type { RawIPA } from './mod';
import type { _ParsedProvision, IPA } from './types';

const _substring = (str: string, start: string, end: string) =>
	str.substring(str.indexOf(start), str.lastIndexOf(end) + end.length);
export const _parse_provision = (mp: string) => parse(_substring(mp, '<plist', '</plist>')) as _ParsedProvision;

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
