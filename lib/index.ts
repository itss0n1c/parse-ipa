import { _parse_file, _parse_url, type RawIPA } from './mod';
import { _parse_blob } from './mod/blob';
import type { IPA, IPAInput } from './types';
import { format_ipa_info, is_url } from './util';

export type { Provision } from './mod';
export * from './types';
export { IPAError } from './util';

/**
 *
 * @param input - string url, File, or BunFile
 * @returns parsed IPA
 * @throws {@link IPAError}
 */
export async function parse_ipa(input: IPAInput): Promise<IPA> {
	let raw: RawIPA;
	if (typeof input === 'string') {
		if (is_url(input)) raw = await _parse_url(input);
		else raw = await _parse_file(input);
	} else raw = await _parse_blob(input);

	return format_ipa_info(raw);
}
