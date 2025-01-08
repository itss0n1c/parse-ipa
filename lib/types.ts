import type { BunFile } from 'bun';
import type { Provision } from './mod';

export type IPAInput = string | File | BunFile;
export type IPAOriginType = 'url' | 'file' | 'blob';
export interface IPAOrigin {
	type: IPAOriginType;
	value: string;
}
export interface IPA {
	/**
	 * The app bundle identifier
	 * @example "com.apple.mobilesafari"
	 */
	bundle_id: string;
	/**
	 * The app name
	 * @example "Safari"
	 */
	name: string;
	/**
	 * The app version
	 * @example "15.0"
	 */
	version: string;
	/**
	 * The app build number
	 * @example "19A339"
	 */
	build: string;
	/**
	 * The app icon size
	 * @example 17692
	 */
	size: number;
	/** Base64 encoded PNG */
	icon: string | null;
	/** signing information, if available */
	provision: Provision | null;
	parser_info: {
		/** the epoch time when the parser completed */
		time: number;
		/** `parse-ipa` version */
		version: string;
		/** how long it took to parse */
		duration: number;
		/** origin of the IPA */
		origin: IPAOrigin;
	};
}
