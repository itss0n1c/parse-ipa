# parse-ipa

### Gather information about an IPA file. Used In [IPA Installer API](https://ipa.s0n1c.ca).

<a href="https://discord.gg/bMFPpxtMTe"><img src="https://img.shields.io/discord/977286501756968971?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
<a href="https://www.npmjs.com/package/parse-ipa"><img src="https://img.shields.io/npm/v/parse-ipa?maxAge=3600" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/parse-ipa"><img src="https://img.shields.io/npm/dt/parse-ipa.svg?maxAge=3600" alt="npm downloads" /></a>

### Documentation live at https://s0n1c.ca/parse-ipa

## Installation

```zsh
% bun i parse-ipa
```

## Usage

`parse-ipa` accepts local paths, HTTP(S) URLs, and `Blob`/`File` inputs on Bun and
Node.js (22.17+). In a browser, import from `parse-ipa/browser` and pass a
`Blob`/`File` or an HTTP(S) URL. Remote hosts must support `HEAD` with
`Content-Length` and byte-range requests; browser requests also need CORS access.

```ts
import { parse_ipa } from "parse-ipa";

let ipa = await parse_ipa(
    "https://github.com/Aidoku/Aidoku/releases/download/v0.8.2/Aidoku.ipa",
);

console.log(ipa.name); // Aidoku
console.log(ipa.version); // 0.8.2
console.log(ipa.build); // 4
console.log(ipa.bundle_id); // app.aidoku.Aidoku
```

## Migrating to 4.0

- Change browser imports to `import { parse_ipa } from "parse-ipa/browser"`.
- The archive must contain exactly one main `Payload/<name>.app/Info.plist`
  with the required app metadata. Missing, ambiguous, or invalid main metadata
  rejects with `IPAError`.
- `icon` is a base64-encoded PNG without a data URL prefix, or `null` when
  no matching standalone icon is found. `Assets.car` is not read. If a selected
  icon cannot be read or decoded, `parse_ipa` rejects with `IPAError`.
- `parser_info.errors` is always an array. A missing provisioning profile
  returns `provision: null` without a diagnostic; an unreadable or invalid
  profile returns `null` with a diagnostic. Profile metadata is extracted,
  not authenticated.
