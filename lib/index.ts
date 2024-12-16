import type { BunFile } from 'bun';
import { _parse_url, type RawIPA } from './mod';
import { _parse_blob } from './mod/blob';
import type { IPA } from './types';
import { format_ipa_info } from './util';

export * from './types';

type IPAInput = string | File | BunFile;

export async function parse_ipa(input: IPAInput): Promise<IPA> {
	let raw: RawIPA;

	if (typeof input === 'string') raw = await _parse_url(input);
	else raw = await _parse_blob(input);

	return format_ipa_info(raw);
}
