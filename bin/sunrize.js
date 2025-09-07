#!/usr/bin/env node
"use strict";

const os = require ("os");
const path = require ("path");
const { spawn } = require ("child_process");
const dir = process .cwd ();
const cwd = path .resolve (__dirname, "..");
const args = process .argv .slice (2);

args .unshift ("start", "--silent", "--");
args .push ("--cwd", dir);

const p = os .platform () === "win32"
   ? spawn ("cmd.exe", ["/c", "npm.cmd", ... args], { cwd })
   : spawn ("npm", args, { cwd });

p .stdout .pipe (process .stdout);
p .stderr .pipe (process .stderr);
