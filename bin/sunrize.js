#!/usr/bin/env node
"use strict";

const os = require ("os");
const path = require ("path");
const { spawn } = require ("child_process");
const win = os .platform () === "win32";
const cwd = process .cwd ();
const args = process .argv .slice (2);

process .chdir (path .resolve (__dirname, ".."));

const p = win
   ? spawn ("cmd.exe", ["/c", "npm.cmd", "start", "--silent", "--", ... args], { cwd })
   : spawn ("npm", ["start", "--silent", "--", ... args], { cwd });

p .stdout .pipe (process .stdout);
p .stderr .pipe (process .stderr);
