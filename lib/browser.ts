import { HTTPRangeReader, unzip, type ZipInfo } from 'unzipit';
import { _parse_raw } from './raw';
import type { IPA, IPAInput } from './types';
import { _format_ipa_info, _get_origin, _is_url, IPAError } from './util';

export * from './types';

const no_path_error = new IPAError(`Browser's do not support file paths. Please provide a URL or a Blob/File object.`);

export async function parse_ipa(input: IPAInput): Promise<IPA> {
	if (typeof input === 'string' && !_is_url(input)) throw no_path_error;
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
			throw no_path_error;
		}
	} else {
		size = input.size;
		zip = await unzip(input);
	}
	const origin = _get_origin(input);

	return { zip, size, origin };
}
