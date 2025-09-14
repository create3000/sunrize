#!/usr/bin/env node
"use strict";

const { systemSync } = require ("shell-tools");

function main ()
{
   systemSync (`npx --yes x3d-image -s "445x445" -e .png -i src/assets/images/loading/loading.x3d`);
   systemSync (`magick src/assets/images/loading/loading.png src/assets/images/loading.gif`);
   systemSync (`rm src/assets/images/loading/loading.png`);
}

main ();
