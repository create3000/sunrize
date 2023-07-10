#!/usr/bin/env node
"use strict"

const os = require ("os")
const path = require ("path")
const { spawn, execFileSync } = require ("child_process")

process .chdir (path .resolve (__dirname, ".."))

execFileSync (os .platform () === "win32" ? "npm.cmd" : "npm", ["install", "--package-lock", "false", "--silent"])

const p = spawn (os .platform () === "win32" ? "npm.cmd" : "npm", ["start", "--silent", "--", ... process .argv .slice (2)])

p .stdout .pipe (process .stdout)
p .stderr .pipe (process .stderr)
