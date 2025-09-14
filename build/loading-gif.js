#!/usr/bin/env node
"use strict";

const { systemSync } = require ("shell-tools");

const
   NUM_FRAMES = 72 / 3,
   DELAY      = 10;

function main ()
{
   for (let i = 1; i <= NUM_FRAMES; ++ i)
   {
      console .log (`Frame: ${i}`);
      systemSync (`cp src/assets/images/loading/loading.frame.x3d src/assets/images/loading/loading${i}.x3d`)
      systemSync (`sed -i '' "s/name='frame'/name='frame' value='${i - 1}'/" src/assets/images/loading/loading${i}.x3d`)
      systemSync (`npx --yes x3d-image -s "445x445" -e .png -i src/assets/images/loading/loading${i}.x3d`);
      systemSync (`magick src/assets/images/loading/loading${i}.png src/assets/images/loading${i}.gif`);
      systemSync (`rm src/assets/images/loading/loading${i}.x3d`);
      systemSync (`rm src/assets/images/loading/loading${i}.png`);
   }

   const gifs = Array .from ({ length: NUM_FRAMES }, (_, i) => `src/assets/images/loading${i + 1}.gif`) .join (" ");

   systemSync (`magick -delay ${DELAY} ${gifs} -loop 0 src/assets/images/loading.gif`)
   systemSync (`rm ${gifs}`);
}

main ();
