#!/usr/bin/env node
"use strict";

const os = require ("os");
const path = require ("path");
const { spawn } = require ("child_process");
const cwd = process .cwd ();
const cmd = os .platform () === "win32" ? "npm.cmd" : "npm";
const args = [... process .argv .slice (2), cwd];

process .chdir (path .resolve (__dirname, ".."));

const p = spawn (cmd, ["start", "--silent", "--", btoa (JSON .stringify (args))], { shell: true });

p .stdout .pipe (process .stdout);
p .stderr .pipe (process .stderr);
