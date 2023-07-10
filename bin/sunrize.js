#!/usr/bin/env node
"use strict"

const os = require ("os")
const path = require ("path")
const { spawn } = require ("child_process")

process .chdir (path .resolve (__dirname, ".."))

const p = spawn (os .platform () === "win32" ? "npm.cmd" : "npm", ["start", "--silent", "--", ... process .argv .slice (2)])

p .stdout .pipe (process .stdout)
p .stderr .pipe (process .stderr)
