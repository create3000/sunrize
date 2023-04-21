#!/usr/bin/env node
const { execFile } = require ("child_process")

execFile ("npm", ["start"] .concat (process .argv .slice (2)), (error, stdout, stderr) =>
{
   if (error)
      process .stderr .write (error .message)

   if (stdout)
      process .stdout .write (stdout)

   if (stderr)
      process .stderr .write (stderr)
})
