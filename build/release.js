#!/usr/bin/env node
"use strict";

const fs = require ("fs");
const { sh, systemSync } = require ("shell-tools");

function main ()
{
	if (sh (`git branch --show-current`) !== "development\n")
	{
		console .error ("Wrong branch, must be development, cannot release version!");
		process .exit (1);
	}

	// merge
	systemSync (`git checkout main`);
	systemSync (`git merge development`);

	// version
	const
		name    = sh (`node -p "require('./package.json').name"`) .trim (),
		online  = sh (`npm view ${name} version`) .trim ();

	if (sh (`npm pkg get version | sed 's/"//g'`) .trim () === online)
		systemSync (`npm version patch --no-git-tag-version --force`);

	const version = sh (`npm pkg get version | sed 's/"//g'`) .trim ();

	console .log (`NPM version ${online}`);
	console .log (`New version ${version}`);

	while (systemSync (`npm i x_ite@latest`))
		systemSync (`countdown 60s`);

	while (systemSync (`npm i x3d-traverse@latest`))
		systemSync (`countdown 60s`);

	// x3duom
	systemSync (`npm run X3DUOM`);

	// docs
	docs (version);

	// commit
	systemSync (`git add -A`);
	systemSync (`git commit -am 'Published version ${version}'`);
	systemSync (`git push origin`);

	// tags are created with github-publisher
	// tag
	systemSync (`git tag ${version}`);
	systemSync (`git push origin --tags`);

	// npm
	systemSync (`npm publish`);

	// merge development into main
	systemSync (`git checkout development`);
	systemSync (`git merge main`);
	systemSync (`git push origin`);

	// // package
	// systemSync (`npm run download`);
}

function docs (version)
{
   // config
	let config = sh (`cat 'docs/_config.yml'`);

	config = config .replace (/\bversion:\s*[\d\.]+/sg, `version: ${version}`);

	fs .writeFileSync ("docs/_config.yml", config);
}

main ();
