#!/usr/bin/env node
"use strict";

const
   pkg            = require ("../package.json"),
   { systemSync } = require ("shell-tools");

function main ()
{
   systemSync (`npm run make`);
   systemSync (`mkdir -p downloads`);
   systemSync (`cp`, `out/make/zip/darwin/x64/${pkg .productName}-darwin-x64-${pkg .version}.zip`, `downloads/Sunrize-macos.zip`);
}

main ();
