"use strict";

if (process .argv .at (-2) === "--cwd")
   process .chdir (process .argv .at (-1));

require ("./Application/Application") .run ();
