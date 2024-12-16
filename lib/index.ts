import { existsSync } from 'node:fs';
import packageInfo from '../package.json';
import { _parse_file, _parse_url, type RawIPA } from './mod';
import type { IPA } from './types';

export * from './types';

const format_ipa_info = (raw: RawIPA): IPA => ({
	bundle_id: raw.info.CFBundleIdentifier,
	name: raw.info.CFBundleName,
	version: raw.info.CFBundleShortVersionString,
	build: raw.info.CFBundleVersion,
	size: raw.size,
	icon: raw.icon?.toString('base64') ?? null,
	...(raw.provision
		? {
				provision: {
					...raw.provision,
					DeveloperCertificates: raw.provision.DeveloperCertificates.map((c) => c.toString('base64')),
					'DER-Encoded-Profile': raw.provision['DER-Encoded-Profile'].toString('base64'),
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

export async function parse_ipa(url_or_path: string): Promise<IPA> {
	const raw = existsSync(url_or_path) ? await _parse_file(url_or_path) : await _parse_url(url_or_path);
	return format_ipa_info(raw);
}
