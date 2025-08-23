"use strict";

const $ = require ("jquery");

require ("qtip2");

$.fn.qtip.zindex = 1000; // Results in 1000 and 1001.

$.fn.popover = function (options)
{
   $("[data-hasqtip]") .qtip ?.("hide") .qtip ("destroy", true);

   if (!options .preview)
      $(".show-preview.on") .removeClass ("on") .addClass ("off");

   let classes = "qtip-tipsy";

   if (options .extension ?.wide)
      classes += " qtip-wide";

   return this .qtip ($.extend (true,
   {
      position: {
         my: "top right",
         at: "bottom left",
         viewport: $("body"),
         effect: false,
      },
      style: {
         classes: classes,
      },
      show: {
         ready: true,
         modal: true,
         solo: true,
         delay: 0,
      },
      hide: {
         event: "click",
      },
      events: {
         hide (event, api)
         {
            api .destroy (true);
         },
      },
   },
   options));
};
