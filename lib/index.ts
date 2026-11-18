import { parse_source } from './raw';
import type { IPA, IPAInput } from './types';
import { is_remote, with_ipa_error } from './util';

export * from './types';
export { IPAError } from './util';

/** Parse an HTTP(S) URL, local path, or Blob without reading the whole IPA up front. */
export async function parse_ipa(input: IPAInput): Promise<IPA> {
	return with_ipa_error('Could not read IPA', async () => {
		if (typeof input !== 'string' || is_remote(input)) return parse_source(input);
		const blob = Bun.file(input);
		return parse_source(blob, { type: 'file', value: input });
	});
}
