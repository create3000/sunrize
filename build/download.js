#!/usr/bin/env node
"use strict";

const { systemSync, sh } = require ("shell-tools");

function main ()
{
   make ();
   docs ();
   merge ();
}

function make ()
{
   systemSync (`rm -r -f out/make/`);

   systemSync (`npm run github -- --platform darwin`);
   systemSync (`npm run github -- --platform win32`);
}

function docs ()
{
   const version = sh (`npm pkg get version | sed 's/"//g'`) .trim ();

   // config
	let config = sh (`cat 'docs/_config.yml'`);

	config = config .replace (/\bversion:\s*[\d\.]+/sg, `version: ${version}`);

	fs .writeFileSync ("docs/_config.yml", config);
}

function merge ()
{
	// commit
	systemSync (`git add -A`);
	systemSync (`git commit -am 'Updated downloads.'`);
	systemSync (`git push origin`);

	// // merge
	// systemSync (`git checkout main`);
	// systemSync (`git merge development`);
	// systemSync (`git push origin`);
	// systemSync (`git checkout development`);
}

main ();
