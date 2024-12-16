#!/usr/bin/env bash

rm -rf dist &&
bun build --target=node --minify lib/index.ts --outdir dist --external partialzip --external bplist-parser --external plist --external cgbi-to-png --external node-stream-zip &&
tsc -p .
