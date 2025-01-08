import { parse } from '@plist/plist';
import type { IPAOrigin } from '../types';
import { _substring, basename } from '../util';

export interface RawProvision extends Record<string, unknown> {
	AppIDName: string;
	ApplicationIdentifierPrefix: string[];
	CreationDate: Date;
	ExpirationDate: Date;
	IsXcodeManaged: false;
	Name: string;
	Platform: string;
	ProvisionedDevices: string[];
	TeamIdentifier: string[];
	TeamName: string;
	TimeToLive: number;
	UUID: string;
	Version: number;
	DeveloperCertificates: ArrayBuffer[];
	'DER-Encoded-Profile': ArrayBuffer;
	Entitlements: Record<string, unknown>;
}

export interface Provision {
	AppIDName: string;
	ApplicationIdentifierPrefix: string[];
	CreationDate: Date;
	ExpirationDate: Date;
	IsXcodeManaged: false;
	Name: string;
	Platform: string;
	ProvisionedDevices: string[];
	TeamIdentifier: string[];
	TeamName: string;
	TimeToLive: number;
	UUID: string;
	Version: number;
	DeveloperCertificates: string[];
	'DER-Encoded-Profile': string;
	Entitlements: Record<string, unknown>;
}

export interface RawIPA {
	info: Record<string, string>;
	size: number;
	icon?: Uint8Array;
	duration: number;
	provision?: RawProvision;
	origin: IPAOrigin;
}

export const _parse_provision = (mp: string) => parse(_substring(mp, '<plist', '</plist>')) as RawProvision;

// biome-ignore lint/suspicious/noExplicitAny: value can be any type
export type RawInfo = Record<string, any>;

export function _icon_clean_name(str: string): [number, number] {
	const base_name = basename(str).replace('AppIcon', '').replace('.png', '').replace('~ipad', '');
	if (!base_name.includes('@')) return [Number.parseInt(base_name.split('x')[0]), 1];
	const [base, size] = base_name.split('@');
	return [Number.parseInt(base.split('x')[0]), Number.parseInt(size.replace('x', ''))];
}

export function _filter_icons(info: RawInfo, _icon_arr: string[]) {
	const _match_key = (key: string): string | undefined => Object.keys(info).find((k) => k.startsWith(key));
	let icon_arr = _icon_arr;
	const keys = Object.keys(info);
	const found_keys = keys.filter((k) => k.startsWith('CFBundleIcons') || k.startsWith('CFBundleIcons~'));
	if (found_keys.length > 0) {
		for (const k of found_keys) {
			if (!info[k].CFBundlePrimaryIcon.CFBundleIconFiles) continue;
			icon_arr.push(...info[k].CFBundlePrimaryIcon.CFBundleIconFiles);
		}
	} else {
		if (!info.CFBundleIconFiles)
			if (!info.CFBundleIconFile) {
				const find = _match_key('CFBundleIconFile~');
				if (!find) icon_arr = [];
				else icon_arr = [find];
			} else icon_arr = [info.CFBundleIconFile];
		else icon_arr = info.CFBundleIconFiles;
	}
	return icon_arr;
}
