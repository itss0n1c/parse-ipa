import { parse_source } from './raw';
import type { IPA, IPAInput } from './types';
import { IPAError, is_remote, with_ipa_error } from './util';

export * from './types';

/** Parse an HTTP(S) URL or Blob (including a file selected in the browser). */
export async function parse_ipa(input: IPAInput): Promise<IPA> {
	if (typeof input === 'string' && !is_remote(input)) {
		throw new IPAError('Browser input must be an HTTP(S) URL or a Blob/File.');
	}
	return with_ipa_error('Could not read IPA', () => parse_source(input));
}
