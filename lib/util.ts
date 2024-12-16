import { parse } from 'plist';
import type { _ParsedProvision } from './types';

const _substring = (str: string, start: string, end: string) =>
	str.substring(str.indexOf(start), str.lastIndexOf(end) + end.length);
export const _parse_provision = (mp: string) => parse(_substring(mp, '<plist', '</plist>')) as _ParsedProvision;

export async function _try_prom<T>(prom: Promise<T> | T): Promise<T | undefined> {
	let res: T | undefined;
	try {
		res = await prom;
	} catch (e) {
		console.error(e);
	}

	return res;
}
