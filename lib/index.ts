import { HTTPRangeReader, unzip, type ZipInfo } from 'unzipit';
import { _parse_raw } from './raw';
import type { IPA, IPAInput } from './types';
import { _format_ipa_info, _get_origin, _is_url } from './util';

export * from './types';
export { IPAError } from './util';

/**
 *
 * @param input - string url, File, or BunFile
 * @returns parsed IPA
 * @throws {@link IPAError}
 */
export async function parse_ipa(input: IPAInput): Promise<IPA> {
	const zip_data = await _get_zip(input);
	const raw = await _parse_raw(zip_data);
	return _format_ipa_info(raw);
}

async function _get_zip(input: IPAInput) {
	let zip: ZipInfo | undefined;
	let size = 0;
	if (typeof input === 'string') {
		if (_is_url(input)) {
			const reader = new HTTPRangeReader(input);
			size = await reader.getLength();
			zip = await unzip(reader);
		} else {
			const file = Bun.file(input);
			size = file.size;
			zip = await unzip(file);
		}
	} else {
		size = input.size;
		zip = await unzip(input);
	}
	const origin = _get_origin(input);

	return { zip, size, origin };
}
