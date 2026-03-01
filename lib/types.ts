import { type } from 'arktype';

/**
 * Schema for provision object using arktype.
 */
export const schema_provision = type({
	AppIDName: 'string',
	ApplicationIdentifierPrefix: type.string.array(),
	CreationDate: 'string.date.iso',
	ExpirationDate: 'string.date.iso',
	IsXcodeManaged: 'boolean',
	Name: 'string',
	Platform: type.string.array(),
	ProvisionedDevices: type.string.array(),
	TeamIdentifier: type.string.array(),
	TeamName: 'string',
	TimeToLive: 'number',
	UUID: 'string',
	Version: 'number',
	DeveloperCertificates: type.string.array(),
	'DER-Encoded-Profile': 'string',
	Entitlements: type.Record(type.string, type.unknown),
});

const _ipa_origin_type = type.enumerated('url', 'file', 'blob');
const _ipa_origin = type({
	type: _ipa_origin_type,
	value: 'string',
});

const _ipa_parser_info = type({
	time: 'number',
	version: 'string',
	duration: 'number',
	origin: _ipa_origin,
});

export const schema_ipa = type({
	bundle_id: 'string',
	name: 'string',
	version: 'string',
	build: 'string',
	size: 'number',
	icon: 'string | null',
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
