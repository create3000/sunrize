#!/usr/bin/env node
"use strict";

const os = require ("os");
const path = require ("path");
const { spawn } = require ("child_process");
const win = os .platform () === "win32";
const cwd = process .cwd ();
const cmd = win ? "npm.cmd" : "npm";
const args = process .argv .slice (2) .map (escapeQuotes);

process .chdir (path .resolve (__dirname, ".."));

const p = spawn (cmd, ["start", "--silent", "--", ... args], { cwd, shell: win });

p .stdout .pipe (process .stdout);
p .stderr .pipe (process .stderr);

function escapeQuotes (arg)
{
   return win ? `"${arg .replaceAll ('"', '"""')}"` : arg;
}
