#!/usr/bin/env bash

rm -rf dist &&
bun build --target=node --minify lib/index.ts --outfile dist/index.js --packages external &&
bun build --target=browser --minify lib/browser.ts --outfile dist/browser.js --packages external &&
tsc -p .
