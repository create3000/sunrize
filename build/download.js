#!/usr/bin/env node
"use strict";

const { sh, systemSync } = require ("shell-tools");

function main ()
{
	const version = sh (`npm pkg get version | sed 's/"//g'`) .trim ();

   systemSync (`npm run package`);
}

main ();
