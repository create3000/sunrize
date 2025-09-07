"use strict";

// Restore cwd.

if (process .argv .at (-2) === "--cwd")
   process .chdir (process .argv .at (-1));

// Run application.

require ("./Application/Application") .run ();
