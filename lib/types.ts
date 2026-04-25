import { type } from 'arktype';

/**
 * Schema for provision object using arktype.
 */
export const schema_provision = type({
	AppIDName: type('string').describe('The name of the App ID associated with the provisioning profile.'),
	ApplicationIdentifierPrefix: type.string
		.array()
		.describe('An array of strings representing the application identifier prefixes.'),
	CreationDate: type('string.date.iso').describe('The date when the provisioning profile was created.'),
	ExpirationDate: type('string.date.iso').describe('The date when the provisioning profile expires.'),
	IsXcodeManaged: type('boolean').describe('Indicates if the provisioning profile is managed by Xcode.'),
	Name: type('string').describe('The name of the provisioning profile.'),
	Platform: type.string
		.array()
		.describe('An array of strings representing the platforms for which the provisioning profile is valid.'),
	ProvisionedDevices: type.string
		.array()
		.describe('An array of strings representing the devices provisioned with the provisioning profile.'),
	TeamIdentifier: type.string.array().describe('An array of strings representing the team identifiers.'),
	TeamName: type('string').describe('The name of the team associated with the provisioning profile.'),
	TimeToLive: type('number').describe('The time to live for the provisioning profile.'),
	UUID: type('string').describe('The unique identifier for the provisioning profile.'),
	Version: type('number').describe('The version of the provisioning profile.'),
	DeveloperCertificates: type.string.array().describe('An array of strings representing the developer certificates.'),
	'DER-Encoded-Profile': type('string').describe('The DER-encoded representation of the provisioning profile.'),
	Entitlements: type
		.Record(type.string, type.unknown)
		.describe('A record of entitlements for the provisioning profile.'),
});

const _ipa_origin = type({
	type: type
		.enumerated('url', 'file', 'blob')
		.describe('The type of origin for the IPA. It can be a URL, a file, or a blob.'),
	value: type('string').describe('The value of the origin.'),
}).describe('The origin of the IPA, including its type and value.');

const _ipa_parser_info = type({
	time: type('number').describe('The time taken to parse the IPA, in milliseconds.'),
	version: type('string').describe('The version of the parse-ipa tool.'),
	duration: type('number').describe('The duration of the parsing operation, in milliseconds.'),
	origin: _ipa_origin,
}).describe('Information about the parsing operation of the IPA.');

export const schema_ipa = type({
	bundle_id: type('string').describe('The bundle identifier of the IPA, which uniquely identifies the app.'),
	name: type('string').describe('The name of the IPA.'),
	version: type('string').describe('The version of the IPA.'),
	build: type('string').describe('The build number of the IPA.'),
	size: type('number').describe('The size of the IPA, in bytes.'),
	icon: type('string | null').describe(
		'The icon of the IPA, in base64 format. It can be null if the icon is not available.',
	),
	provision: schema_provision
		.or('null')
		.describe(
			'The provisioning profile associated with the IPA. It can be null if the provisioning profile is not available.',
		),
	parser_info: _ipa_parser_info,
}).describe(
	'The structure of the IPA, including its bundle ID, name, version, build number, size, icon, provisioning profile, and parsing information.',
);

export type IPAInput = string | File | Bun.BunFile;

/** @interface */
export type Provision = typeof schema_provision.infer;

/** @interface */
export type IPAOrigin = typeof _ipa_origin.infer;

/** @interface */
export type IPA = typeof schema_ipa.infer;
