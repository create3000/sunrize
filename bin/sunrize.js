#!/usr/bin/env node
"use strict"

const os = require ("os")
const fs = require ("fs")
const path = require ("path")
const { spawn, execFileSync } = require ("child_process")

process .chdir (path .resolve (__dirname, ".."))

if (!fs .existsSync ((path .resolve (__dirname, "..", "node_modules"))))
   execFileSync (os .platform () === "win32" ? "npm.cmd" : "npm", ["install"])

const p = spawn (os .platform () === "win32" ? "npm.cmd" : "npm", ["start", "--silent", "--", ... process .argv .slice (2)])

p .stdout .pipe (process .stdout)
p .stderr .pipe (process .stderr)
