#!/usr/bin/env node
"use strict";

const { sh, system } = require ("shell-tools");

async function main ()
{
	if (sh`git branch --show-current` !== "development\n")
	{
		console .error ("Wrong branch, must be development, cannot release version!");
		process .exit (1);
	}

	// merge
	await system (`git checkout main`);
	await system (`git merge development`);

	// version
	const
		name    = sh`node -p "require('./package.json').name"` .trim (),
		online  = sh`npm view ${name} version` .trim ();

	if (sh`npm pkg get version | sed 's/"//g'` .trim () === online)
		await system (`npm version patch --no-git-tag-version --force`);

	const version = sh`npm pkg get version | sed 's/"//g'` .trim ();

	console .log (`NPM version ${online}`);
	console .log (`New version ${version}`);

	await system (`npm i x_ite@latest`);

	// commit
	await system (`git add -A`);
	await system (`git commit -am 'Published version ${version}'`);
	await system (`git push origin`);

	// tag
	await system (`git tag ${version}`);
	await system (`git push origin --tags`);

	// npm
	await system (`npm publish`);

	// development
	await system (`git checkout development`);
	await system (`git merge main`);
	await system (`git push origin`);
}

main ();
