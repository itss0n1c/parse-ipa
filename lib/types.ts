import { type } from 'arktype';

/**
 * Schema for provision object using arktype.
 */
export const schema_provision = type({
	/**
	 * The app ID name
	 */
	AppIDName: 'string',
	/**
	 * The application identifier prefix
	 */
	ApplicationIdentifierPrefix: type.string.array(),
	/**
	 * The creation date
	 */
	CreationDate: 'Date',
	/**
	 * The expiration date
	 */
	ExpirationDate: 'Date',
	/**
	 * If the app is managed by Xcode
	 */
	IsXcodeManaged: 'boolean',
	/**
	 * The name of the provision
	 */
	Name: 'string',
	/**
	 * The platforms the provision is for
	 */
	Platform: type.string.array(),
	/**
	 * The UDIDs the provision is for (typically for individual developer accounts)
	 */
	ProvisionedDevices: type.string.array(),
	/**
	 * The team identifier
	 */
	TeamIdentifier: type.string.array(),
	/**
	 * The team name
	 */
	TeamName: 'string',
	/**
	 * How long the provision is valid for (in days)
	 */
	TimeToLive: 'number',
	/**
	 * The UUID of the provision
	 */
	UUID: 'string',
	/**
	 * The version of the provision
	 */
	Version: 'number',
	/**
	 * The developer certificates (as base64 encoded strings)
	 */
	DeveloperCertificates: type.string.array(),
	/**
	 * The DER encoded profile (as a base64 encoded string)
	 */
	'DER-Encoded-Profile': 'string',
	/**
	 * The entitlements
	 */
	Entitlements: type.Record(type.string, type.unknown),
});

const _ipa_origin_type = type.enumerated('url', 'file', 'blob');
const _ipa_origin = type({
	type: _ipa_origin_type,
	value: 'string',
});

const _ipa_parser_info = type({
	/** the epoch time when the parser completed */
	time: 'number',
	/** `parse-ipa` version */
	version: 'string',
	/** how long it took to parse */
	duration: 'number',
	/** origin of the IPA */
	origin: _ipa_origin,
});

export const schema_ipa = type({
	/**
	 * The app bundle identifier
	 * @example "com.apple.mobilesafari"
	 */
	bundle_id: 'string',
	/**
	 * The app name
	 * @example "Safari"
	 */
	name: 'string',
	/**
	 * The app version
	 * @example "15.0"
	 */
	version: 'string',
	/**
	 * The app build number
	 * @example "19A339"
	 */
	build: 'string',
	/**
	 * The app icon size
	 * @example 17692
	 */
	size: 'number',
	/** Base64 encoded PNG */
	icon: 'string | null',
	/**
	 * signing information, if available.
	 *
	 * View the {@link Provision} interface for more information.
	 *
	 * @see {@link Provision}
	 */
	provision: schema_provision.or('null'),
	parser_info: _ipa_parser_info,
});

export type IPAInput = string | File | Bun.BunFile;

/** @interface */
export type Provision = typeof schema_provision.infer;

/** @interface */
export type IPAOrigin = typeof _ipa_origin.infer;

/** @interface */
export type IPA = typeof schema_ipa.infer;
