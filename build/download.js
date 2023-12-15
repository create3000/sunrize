#!/usr/bin/env node
"use strict";

const
   pkg            = require ("../package.json"),
   { systemSync } = require ("shell-tools");

function main ()
{
   systemSync (`rm -r -f out/make/`);

   systemSync (`npm run make -- --platform darwin`);
   systemSync (`cp`, `out/make/${pkg .productName}-${pkg .version}-x64.dmg`, `downloads/${pkg .productName}.dmg`);

   systemSync (`npm run make -- --platform win32`);
   systemSync (`cp`, `out/make/squirrel.windows/x64/${pkg .productName}-${pkg .version} Setup.exe`, `downloads/${pkg .productName} Setup.exe`);
}

main ();
