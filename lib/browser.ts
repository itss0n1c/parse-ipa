import type { BunFile } from 'bun';
import { _parse_blob } from './mod/blob';
import type { IPA } from './types';
import { format_ipa_info } from './util';

export * from './types';

type IPAInput = string | File | BunFile;

export async function parse_ipa(input: IPAInput): Promise<IPA> {
	if (typeof input === 'string') throw new Error('Not implemented');
	const raw = await _parse_blob(input);

	return format_ipa_info(raw);
}
