#!/usr/bin/env node
"use strict"

const { execFile } = require ("child_process")

execFile ("npm", ["start", "--", ... process .argv .slice (2)], (error, stdout, stderr) =>
{
   if (error)
      return process .stderr .write (error .message)

   if (stdout)
      process .stdout .write (stdout)

   if (stderr)
      process .stderr .write (stderr)
})
