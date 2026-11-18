export class IPAError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'IPAError';
	}
}

export function is_remote(input: string): boolean {
	return /^https?:\/\//i.test(input);
}

export function to_base64(bytes: Uint8Array): string {
	if (typeof bytes.toBase64 === 'function') return bytes.toBase64();
	const chunks: string[] = [];
	for (let i = 0; i < bytes.length; i += 8192) {
		chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
	}
	return btoa(chunks.join(''));
}

export async function with_ipa_error<T>(message: string, run: () => Promise<T>): Promise<T> {
	try {
		return await run();
	} catch (cause) {
		if (cause instanceof IPAError) throw cause;
		throw new IPAError(message, { cause });
	}
}
