export type _ParsedProvision = Record<'AppIDName' | 'Name' | 'TeamName' | 'UUID', string> &
	Record<'ApplicationIdentifierPrefix' | 'Platform' | 'ProvisionedDevices' | 'TeamIdentifier', string[]> &
	Record<'CreationDate' | 'ExpirationDate', Date> &
	Record<'IsXcodeManaged', false> &
	Record<'DeveloperCertificates', Buffer[]> &
	Record<'DER-Encoded-Profile', Buffer> &
	Record<'Entitlements', Record<string, unknown>> &
	Record<'TimeToLive' | 'Version', number>;

export type Provision = Omit<_ParsedProvision, 'DeveloperCertificates' | 'DER-Encoded-Profile'> &
	Record<'DeveloperCertificates', string[]> &
	Record<'DER-Encoded-Profile', string>;

export type IPAOriginType = 'url' | 'file';
export interface IPAOrigin {
	type: IPAOriginType;
	value: string;
}
export interface IPA {
	/** bundle id */
	bundle_id: string;
	/** app name */
	name: string;
	/** version number */
	version: string;
	/** build number */
	build: string;
	/** byte size */
	size: number;
	/** Base64 encoded PNG */
	icon: string | null;
	/** signing information, if available */
	provision: Provision | null;
	parser_info: {
		/** when the parser finished */
		time: number;
		/* parser version */
		version: string;
		/** how long it took to parse */
		duration: number;
		/** origin */
		origin: IPAOrigin;
	};
}
