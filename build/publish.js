#!/usr/bin/env node
"use strict";

function sh (strings, ... values)
{
   const { execSync } = require ("child_process");

   return execSync (String .raw ({ raw: strings }, ... values), { encoding: "utf8", maxBuffer: Infinity });
}

if (sh`git branch --show-current` !== "development\n")
{
	console .error ("Wrong branch, must be development, cannot release version!");
	process .exit (1);
}

// merge
sh`git checkout main`;
sh`git merge development`;

// version
const
	name    = sh`node -p "require('./package.json').name"` .trim (),
	version = sh`npm pkg get version | sed 's/"//g'` .trim (),
	online  = sh`npm view ${name} version` .trim ();

console .log (`package.json version ${version}`);
console .log (`NPM version ${online}`);

if (version === online)
	sh`npm version patch --no-git-tag-version --force`;

sh`npm i x_ite@latest`;

// commit
sh`git add -A`;
sh`git commit -am 'Published version ${version}'`;
sh`git push origin`;

// tag
sh`git tag ${version}`;
sh`git push origin --tags`;

// npm
sh`npm publish`;

// development
sh`git checkout development`;
sh`git merge main`;
sh`git push origin`;
