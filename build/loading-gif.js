#!/usr/bin/env node
"use strict";

const { systemSync } = require ("shell-tools");

const
   NUM_FRAMES = 3,
   DELAY      = 40;

function main ()
{
   for (let i = 1; i <= NUM_FRAMES; ++ i)
   {
      systemSync (`npx --yes x3d-image -s "445x445" -e .png -i src/assets/images/loading/loading${i}.x3d`);
      systemSync (`magick src/assets/images/loading/loading${i}.png src/assets/images/loading${i}.gif`);
      systemSync (`rm src/assets/images/loading/loading${i}.png`);
   }

   systemSync (`magick -delay ${DELAY} src/assets/images/loading3.gif src/assets/images/loading2.gif src/assets/images/loading1.gif -loop 0 src/assets/images/loading.gif`)

   for (let i = 1; i <= NUM_FRAMES; ++ i)
      systemSync (`rm src/assets/images/loading${i}.gif`);
}

main ();
