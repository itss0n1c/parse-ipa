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
`parse-ipa` is available via server-side (Bun & Node.js), as well as in browser.

<sub>**Note**: Browser does not support file system paths.</sub>

```ts
import { parse_ipa } from "parse-ipa";

let ipa = await parse_ipa(
  "https://github.com/NeoFreeBird/app/releases/download/2.2/NeoFreeBird-2.2-Twitter-11.35.ipa"
);

console.log(ipa.name); // Twitter
console.log(ipa.version); // 11.35
console.log(ipa.build); // 12
console.log(ipa.bundle_id); // com.atebits.Tweetie2
```
