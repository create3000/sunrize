"use strict";

process .argv = process .argv .concat (JSON .parse (atob (process .argv .pop ())));

const app = require ("./Application/Application") .run ();
