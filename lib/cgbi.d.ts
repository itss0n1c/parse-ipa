declare module 'cgbi-to-png' {
	import type { Readable } from 'node:stream';
	export default function cgbi(stream: Readable, cb: (err: Error, stream: Readable) => void): void;
}
