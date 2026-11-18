import { parse_source } from './raw/index.ts';
import type { IPA, IPAInput } from './types.ts';
import { is_remote, with_ipa_error } from './util.ts';

export * from './types.ts';
export { IPAError } from './util.ts';

/** Parse an HTTP(S) URL, local path, or Blob without reading the whole IPA up front. */
export async function parse_ipa(input: IPAInput): Promise<IPA> {
	return with_ipa_error('Could not read IPA', async () => {
		if (typeof input !== 'string' || is_remote(input)) return parse_source(input);
		const blob = typeof Bun !== 'undefined' ? Bun.file(input) : await (await import('node:fs')).openAsBlob(input);
		return parse_source(blob, { type: 'file', value: input });
	});
}
