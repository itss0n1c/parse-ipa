import { parse } from '@plist/plist';
import { t } from 'elysia';
import type { IPAOrigin } from '../types';
import { _substring, basename } from '../util';

export interface RawProvision extends Record<string, unknown> {
	AppIDName: string;
	ApplicationIdentifierPrefix: string[];
	CreationDate: Date;
	ExpirationDate: Date;
	IsXcodeManaged: false;
	Name: string;
	Platform: string[];
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

/**
 * Schema for provision object.
 *
 * Useful for using with Elysia (which uses TypeBox).
 */
export const parse_ipa_schema_provision = t.Object({
	AppIDName: t.String(),
	ApplicationIdentifierPrefix: t.Array(t.String()),
	CreationDate: t.Date(),
	ExpirationDate: t.Date(),
	IsXcodeManaged: t.Boolean(),
	Name: t.String(),
	Platform: t.Array(t.String()),
	ProvisionedDevices: t.Array(t.String()),
	TeamIdentifier: t.Array(t.String()),
	TeamName: t.String(),
	TimeToLive: t.Number(),
	UUID: t.String(),
	Version: t.Number(),
	DeveloperCertificates: t.Array(t.String()),
	'DER-Encoded-Profile': t.String(),
	Entitlements: t.Record(t.String(), t.Unknown()),
});

/**
 * The provision object
 * @property AppIDName - The app ID name
 * @property ApplicationIdentifierPrefix - The application identifier prefix
 * @property CreationDate - The creation date
 * @property ExpirationDate - The expiration date
 * @property IsXcodeManaged - If the app is managed by Xcode
 * @property Name - The name of the provision
 * @property Platform - The platforms the provision is for
 * @property ProvisionedDevices - The UDIDs the provision is for (typically for individual developer accounts)
 * @property TeamIdentifier - The team identifier
 * @property TeamName - The team name
 * @property TimeToLive - How long the provision is valid for (in days)
 * @property UUID - The UUID of the provision
 * @property Version - The version of the provision
 * @property DeveloperCertificates - The developer certificates (as base64 encoded strings)
 * @property DER-Encoded-Profile - The DER encoded profile (as a base64 encoded string)
 * @property Entitlements - The entitlements
 * @interface
 */
export type Provision = typeof parse_ipa_schema_provision.static;

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
