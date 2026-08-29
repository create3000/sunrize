"use strict";

const $ = require ("jquery");

require ("./Popover");

$.fn.volumeSliderPopover = function (browser)
{
   // Create content.

   const input = $("<input>")
      .attr ("type", "range")
      .attr ("min", 0)
      .attr ("max", 1)
      .attr ("step", "any")
      .val (browser .getBrowserOption ("SoundIntensity"))
      .css ({ "height": 120, "writing-mode": "vertical-lr", "direction": "rtl" })
      .on ("input", () => browser .setBrowserOption ("SoundIntensity", input .val ()));

   // Create tooltip.

   this .popover ({
      content: input,
      position: {
         my: "right top",
         at: "bottom left",
      },
      style: {
         classes: "qtip-tipsy qtip-preview qtip-sound-intensity",
      },
      events: {
         hide: (event, api) =>
         {
            api .destroy (true);
         },
      },
   });

   return this;
};

