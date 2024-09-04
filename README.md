# parse-ipa
### Fetch and gather information about an IPA file. Used In [IPA Installer API](https://ipa.s0n1c.ca).

<a href="https://discord.gg/8bt5dbycDM"><img src="https://img.shields.io/discord/977286501756968971?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
<a href="https://www.npmjs.com/package/parse-ipa"><img src="https://img.shields.io/npm/v/parse-ipa?maxAge=3600" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/parse-ipa"><img src="https://img.shields.io/npm/dt/parse-ipa.svg?maxAge=3600" alt="npm downloads" /></a>


## Installation

```zsh
% bun add parse-ipa
```

## Usage

```ts
import { parse_ipa } from "parse-ipa";

let ipa = await parse_ipa(
  "https://github.com/Aidoku/Aidoku/releases/download/v0.6.6/Aidoku.ipa"
);

console.log(ipa.name); // Aidoku
console.log(ipa.version); // 0.6.6
console.log(ipa.build); // 2
console.log(ipa.bundle_id); // xyz.skitty.Aidoku
```
