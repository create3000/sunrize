"use strict";

if (process .argv .length > 2)
{
   process .argv = process .argv .concat (JSON .parse (atob (process .argv .pop ())));
   process .chdir (process .argv .pop ());
}

const app = require ("./Application/Application") .run ();
