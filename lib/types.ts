import * as t from '@sinclair/typebox';
import type { BunFile } from 'bun';

/**
 * Schema for provision object.
 *
 * Useful for using with TypeBox (in something like Elysia).
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
	/**
	 * signing information, if available.
	 *
	 * View the {@link Provision} interface for more information.
	 *
	 * @see {@link Provision}
	 */
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
