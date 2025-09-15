#!/usr/bin/env node
"use strict";

const { systemSync } = require ("shell-tools");

const
   NUM_FRAMES = 360 / 3,
   DELAY      = 4;

const
   images  = `src/assets/images`,
   loading = `src/assets/images/loading`;

function main ()
{
   // Create X3D frames.

   for (let i = 1; i <= NUM_FRAMES; ++ i)
   {
      systemSync (`cp ${loading}/loading.x3d ${loading}/loading${i}.x3d`)
      systemSync (`sed -i "" "s/name='frame'/name='frame' value='${i - 1}'/" ${loading}/loading${i}.x3d`)
   }

   // Create PNG frames.

   const x3d = Array .from ({ length: NUM_FRAMES }, (_, i) => `${loading}/loading${i + 1}.x3d`) .join (" ");

   systemSync (`npx --yes x3d-image -s "445x445" -e .png -i ${x3d} -l`);
   systemSync (`rm ${x3d}`);

   // Create GIF animation.

   const png = Array .from ({ length: NUM_FRAMES }, (_, i) => `${loading}/loading${i + 1}.png`) .join (" ");

   systemSync (`magick -delay ${DELAY} ${png} -alpha remove -layers OptimizePlus -loop 0 ${images}/loading.gif`);
   systemSync (`rm ${png}`);

   // Optimize GIF.

   systemSync (`gifsicle --batch -O3 --colors 256 ${images}/loading.gif`);
}

main ();
