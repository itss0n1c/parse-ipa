import type { ZipInfo } from 'unzipit';
import type { IPAOrigin } from '../types';

export interface IPAZipData {
	zip: ZipInfo;
	size: number;
	origin: IPAOrigin;
}

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

export interface RawIPA {
	info: Record<string, string>;
	size: number;
	icon?: Uint8Array;
	duration: number;
	provision?: RawProvision;
	origin: IPAOrigin;
}
