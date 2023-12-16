#!/usr/bin/env node
"use strict";

const { systemSync } = require ("shell-tools");

function main ()
{
   make ();
}

function make ()
{
   systemSync (`rm -r -f out/make/`);

   systemSync (`npm run github -- --platform darwin`);
   systemSync (`npm run github -- --platform win32`);
}

main ();
