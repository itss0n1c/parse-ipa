import { _parse_blob } from './mod/blob';
import type { IPA, IPAInput } from './types';
import { format_ipa_info, IPAError } from './util';

export * from './types';

export async function parse_ipa(input: IPAInput): Promise<IPA> {
	if (typeof input === 'string') throw new IPAError('URL parsing not supported in browser');
	const raw = await _parse_blob(input);
	return format_ipa_info(raw);
}
