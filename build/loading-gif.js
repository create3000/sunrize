#!/usr/bin/env node
"use strict";

const { systemSync } = require ("shell-tools");

const
   NUM_FRAMES = 72 / 3,
   DELAY      = 20;

function main ()
{
   // Create X3D frames.

   for (let i = 1; i <= NUM_FRAMES; ++ i)
   {
      systemSync (`cp src/assets/images/loading/loading.x3d src/assets/images/loading/loading${i}.x3d`)
      systemSync (`sed -i '' "s/name='frame'/name='frame' value='${i - 1}'/" src/assets/images/loading/loading${i}.x3d`)
   }

   // Create GIF frames.

   const x3d = Array .from ({ length: NUM_FRAMES }, (_, i) => `src/assets/images/loading/loading${i + 1}.x3d`) .join (" ");

   systemSync (`npx --yes x3d-image -s "445x445" -e .png -i ${x3d} -l`);

   for (let i = 1; i <= NUM_FRAMES; ++ i)
   {
      systemSync (`magick src/assets/images/loading/loading${i}.png src/assets/images/loading${i}.gif`);
      systemSync (`rm src/assets/images/loading/loading${i}.x3d`);
      systemSync (`rm src/assets/images/loading/loading${i}.png`);
   }

   // Create GIF animation.

   const gif = Array .from ({ length: NUM_FRAMES }, (_, i) => `src/assets/images/loading${i + 1}.gif`) .join (" ");

   systemSync (`magick -delay ${DELAY} ${gif} -loop 0 src/assets/images/loading.gif`);
   systemSync (`rm ${gif}`);

   // Optimize GIF.

   systemSync (`gifsicle --batch -O3 -i src/assets/images/loading.gif`);
}

main ();
