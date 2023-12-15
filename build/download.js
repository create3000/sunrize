#!/usr/bin/env node
"use strict";

const
   pkg                = require ("../package.json"),
	fs                 = require ("fs"),
   { systemSync, sh } = require ("shell-tools");

function main ()
{
   // make ();
   docs();
}

function make ()
{
   systemSync (`rm -r -f out/make/`);

   systemSync (`npm run make -- --platform darwin`);
   systemSync (`cp`, `out/make/${pkg .productName}-${pkg .version}-x64.dmg`, `downloads/${pkg .productName}.dmg`);

   systemSync (`npm run make -- --platform win32`);
   systemSync (`cp`, `out/make/squirrel.windows/x64/${pkg .productName}-${pkg .version} Setup.exe`, `downloads/${pkg .productName} Setup.exe`);
}

function docs ()
{
	const
		version = sh (`npm pkg get version | sed 's/"//g'`) .trim (),
		dmg     = fs .statSync ("downloads/Sunrize X3D Editor.dmg") .size,
		exe     = fs .statSync ("downloads/Sunrize X3D Editor Setup.exe") .size;

   // config
	let config = sh (`cat 'docs/_config.yml'`);

	config = config .replace (/\bversion:\s*[\d\.]+/sg, `version: ${version}`);
	config = config .replace (/\bdownload_dmg:\s*\d+/sg, `download_dmg: ${dmg}`);
	config = config .replace (/\bdownload_exe:\s*\d+/sg, `download_exe: ${exe}`);

	fs .writeFileSync ("docs/_config.yml", config);

	// commit
	systemSync (`git add -A`);
	systemSync (`git commit -am 'Updated documentation.'`);
	systemSync (`git push origin`);

	// release
	systemSync (`git checkout main`);
	systemSync (`git merge development`);
	systemSync (`git checkout development`);
	systemSync (`git merge main`);
	systemSync (`git push origin`);
}

main ();
