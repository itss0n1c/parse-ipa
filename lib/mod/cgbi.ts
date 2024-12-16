import cgbi from 'cgbi-to-png';
import { Readable } from 'node:stream';

export function _icon_fix(icon: Uint8Array): Promise<Uint8Array> {
	const stream = new Readable({
		read() {
			this.push(icon);
			this.push(null);
		},
	});
	return new Promise((resolve, reject) =>
		cgbi(stream, (err, stream) => {
			if (err) return reject(err);
			const chunks: Array<Uint8Array> = [];
			stream.on('data', (chunk) => chunks.push(chunk));
			stream.on('end', () => {
				const res = new Uint8Array(chunks.reduce((a, b) => a + b.length, 0));
				let offset = 0;
				for (const chunk of chunks) {
					res.set(chunk, offset);
					offset += chunk.length;
				}
				resolve(res);
			});
		}),
	);
}
